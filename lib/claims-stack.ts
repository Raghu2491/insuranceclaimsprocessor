import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export interface ClaimsStackProps extends cdk.StackProps {
  /** Optional initials -> bucket named claim-documents-poc-<initials>. */
  initials?: string;
  /** Origins allowed to call the API and PUT to the bucket (browser CORS). */
  allowedOrigins?: string[];
}

/**
 * Provisions:
 *   - S3 bucket for claim documents (claims/ prefix)
 *   - a Lambda that mints presigned upload URLs
 *   - an HTTP API with GET /upload-url in front of it
 */
export class ClaimsStack extends cdk.Stack {
  public readonly claimsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: ClaimsStackProps = {}) {
    super(scope, id, props);

    const allowedOrigins = props.allowedOrigins ?? ['http://localhost:5173'];

    // ---- S3 bucket ----
    this.claimsBucket = new s3.Bucket(this, 'ClaimsBucket', {
      bucketName: props.initials
        ? `claim-documents-poc-${props.initials.toLowerCase()}`
        : undefined,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // POC cleanup
      autoDeleteObjects: true,
      // Allow the browser to PUT straight to S3 via the presigned URL.
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins,
          allowedHeaders: ['*'],
        },
      ],
    });

    // ---- Presign Lambda ----
    const presignFn = new lambdaNode.NodejsFunction(this, 'PresignFn', {
      entry: path.join(__dirname, '..', 'lambda', 'presign.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      environment: { BUCKET_NAME: this.claimsBucket.bucketName },
    });
    // Grants s3:PutObject on the bucket (needed to sign a PUT URL).
    this.claimsBucket.grantPut(presignFn, 'claims/*');

    // ---- HTTP API: GET /upload-url ----
    const httpApi = new apigw.HttpApi(this, 'ClaimsApi', {
      corsPreflight: {
        allowOrigins: allowedOrigins,
        allowMethods: [apigw.CorsHttpMethod.GET],
        allowHeaders: ['*'],
      },
    });
    httpApi.addRoutes({
      path: '/upload-url',
      methods: [apigw.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'PresignIntegration',
        presignFn,
      ),
    });

    // ---- Outputs ----
    new cdk.CfnOutput(this, 'ClaimsBucketName', {
      value: this.claimsBucket.bucketName,
      description: 'Upload claim documents under the claims/ prefix',
    });
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.apiEndpoint,
      description: 'Set this as VITE_API_BASE_URL in web/.env',
    });
  }
}
