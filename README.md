# Claim Processor — CDK (TypeScript)

> Infrastructure-as-code for an AI-powered insurance-claim processor on AWS
> (Amazon S3 + Amazon Bedrock), provisioned with **AWS CDK** and **TypeScript**.
> Built for the AWS Exam Prep (AIP-C01) Task 1.1 bonus assignment.

This first version provisions exactly one thing so you can prove the pipeline
against your **own AWS account**: an **S3 bucket** in **us-east-1** for claim
documents. Once this deploys cleanly, we layer the Lambda claim-processor,
Bedrock permissions, and DynamoDB on top of the same bucket.

```
claim-processor-cdk/
├── bin/app.ts          # CDK app entry — instantiates the stack in us-east-1
├── lib/claims-stack.ts # the stack — currently just the S3 bucket
├── cdk.json            # tells the CDK CLI how to run the app
├── package.json
└── tsconfig.json
```

---

## 1. Prerequisites

- **Node.js 20+** and npm
- **AWS CLI v2** installed
- An **AWS account** you can deploy to

## 2. Connect your AWS account

CDK deploys with whatever credentials your AWS CLI is configured with. Set them
up once, then confirm who you are:

```bash
aws configure           # or: aws configure sso   (for IAM Identity Center)
aws sts get-caller-identity
```

That last command should print your Account ID and user/role ARN. If it does,
CDK will deploy into that account.

> The deploying identity needs permission to create CloudFormation stacks and
> the resources in them (S3 here). An admin user, or a role with equivalent
> permissions, is simplest for a personal account.

## 3. Install

```bash
cd claim-processor-cdk
npm install
```

## 4. Bootstrap (one-time per account + region)

CDK needs a small "bootstrap" stack in each account/region before its first
deploy (it holds the asset bucket and deploy roles).

```bash
# uses your current credentials + region
npx cdk bootstrap

# or be explicit:
npx cdk bootstrap aws://<your-account-id>/us-east-1
```

## 5. See what it will create (no changes yet)

```bash
npx cdk synth      # prints the generated CloudFormation
npx cdk diff       # shows what would change vs. what's deployed
```

## 6. Deploy

```bash
npx cdk deploy
# optional friendly bucket name (must be globally unique, lowercase):
npx cdk deploy -c initials=xyz     # -> claim-documents-poc-xyz
```

After it finishes, CDK prints the outputs, including **ClaimsBucketName**.
Verify:

```bash
aws s3 ls | grep claim-documents
# upload a test object under the claims/ prefix:
echo "hello" > sample.txt
aws s3 cp sample.txt s3://<ClaimsBucketName>/claims/sample.txt
aws s3 ls s3://<ClaimsBucketName>/claims/
```

## 7. Tear it down

```bash
npx cdk destroy
```

Because this is a POC, the bucket is set to `removalPolicy: DESTROY` with
`autoDeleteObjects: true`, so `destroy` empties and removes it. For a bucket you
want to keep, remove those two lines in `lib/claims-stack.ts`.

---

## What this costs

An empty S3 bucket costs effectively nothing; you pay only for stored data and
requests. The one-time bootstrap stack is also negligible.

## Handy commands

| Command | What it does |
|---------|--------------|
| `npm run synth` | Generate the CloudFormation template |
| `npm run diff` | Diff local stack vs. deployed |
| `npm run deploy` | Deploy to your account |
| `npm run destroy` | Delete the stack |

## Security note

AWS credentials are **not** stored in this repo — CDK reads them from your local
`~/.aws/` configuration at deploy time. `.gitignore` excludes `node_modules`,
`.env`, `*.pem`, `*.key`, and `cdk.out` so nothing sensitive is committed.

## Next steps (planned)

1. Add an **AWS Lambda** claim-processor and grant it `s3:GetObject` on the bucket.
2. Trigger it on **S3 upload events** (`claims/` prefix).
3. Grant **Bedrock InvokeModel** and call the model from the Lambda.
4. Add a **DynamoDB** table to persist extracted fields + summaries.

## License

Released under the [MIT License](LICENSE).
