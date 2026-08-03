#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ClaimsStack } from '../lib/claims-stack';

const app = new cdk.App();

// Optional friendly bucket name: `cdk deploy -c initials=xyz`
// -> creates claim-documents-poc-xyz. Omit it and CDK auto-names the bucket.
const initials = app.node.tryGetContext('initials');

new ClaimsStack(app, 'ClaimProcessorStack', {
  initials,
  // Deploys to YOUR account (resolved from your configured AWS credentials),
  // pinned to us-east-1. Override the region with CDK_DEFAULT_REGION if needed.
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  description: 'Claim Processor POC — foundational S3 bucket (start small).',
});
