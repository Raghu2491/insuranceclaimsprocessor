import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface ClaimsStackProps extends cdk.StackProps {
  /** Optional initials -> bucket named claim-documents-poc-<initials>. */
  initials?: string;
}

/**
 * Foundational stack. For now it provisions ONE thing: the S3 bucket that
 * claim documents are uploaded to (under the `claims/` key prefix). We'll add
 * the Lambda claim-processor, Bedrock permissions, and DynamoDB on top of this
 * bucket in later steps.
 */
export class ClaimsStack extends cdk.Stack {
  public readonly claimsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: ClaimsStackProps = {}) {
    super(scope, id, props);

    this.claimsBucket = new s3.Bucket(this, 'ClaimsBucket', {
      // If you pass -c initials=xyz the bucket gets a friendly, predictable
      // name; otherwise CDK generates a globally-unique one automatically.
      bucketName: props.initials
        ? `claim-documents-poc-${props.initials.toLowerCase()}`
        : undefined,

      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,

      // POC-friendly cleanup: `cdk destroy` empties and removes the bucket.
      // Remove both lines for a bucket you want to keep across deploys.
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Handy: the bucket name is printed after `cdk deploy`.
    new cdk.CfnOutput(this, 'ClaimsBucketName', {
      value: this.claimsBucket.bucketName,
      description: 'Upload claim documents under the claims/ prefix of this bucket',
    });

    new cdk.CfnOutput(this, 'ClaimsBucketArn', {
      value: this.claimsBucket.bucketArn,
    });
  }
}
