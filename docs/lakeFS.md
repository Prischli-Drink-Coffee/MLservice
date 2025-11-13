# lakeFS Multiple Storage Backends Guide

## Overview
Multi-storage backend support enables lakeFS to manage data across multiple storage systems simultaneously (AWS S3, Azure Blob, GCS, S3-compatible, local). Available in lakeFS Enterprise 1.51.0+.

## Key Benefits
- **Unified Management**: Manage data across on-prem, cloud, and hybrid environments
- **Centralized Governance**: Consistent RBAC and policies across all storage systems
- **Zero-Copy Branching**: Create isolated environments without data duplication

## Configuration

### Basic Structure
```yaml
blockstores:
  signing:
    secret_key: "some-secret"
  stores:
    - id: "storage-1"
      type: "s3"
      s3:
        endpoint: 'http://minio-prod.local'
        credentials:
          access_key_id: "access_key"
          secret_access_key: "secret_key"
    - id: "storage-2"
      type: "s3"
      s3:
        region: "us-east-1"

Example: Multi-Cloud Setup
blockstores:
  signing:
    secret_key: "signing-secret"
  stores:
    - id: "aws-prod"
      description: "AWS S3 production"
      type: "s3"
      s3:
        region: "us-east-1"
    - id: "azure-backup"
      description: "Azure Blob backup"
      type: "azure"
      azure:
        storage_account: "myaccount"
```

Working with Repositories

Creating Repositories with Storage ID
import lakefs

# Create repo on specific storage

```python
repo = lakefs.repository("my-repo", client=client)
repo.create(storage_namespace="s3://bucket/path",
storage_id="aws-prod")
```

View Repository Details
```python
repo = lakefs.repository("my-repo", client=client)
print(f"Storage: {repo.metadata.storage_id}")
print(f"Namespace: {repo.metadata.storage_namespace}")
```

Boto3 Integration

```python
# Client Setup
import boto3
from botocore.config import Config

config = Config(
    request_checksum_calculation='when_required',
    response_checksum_validation='when_required'
)

s3 = boto3.client(
    's3',
    endpoint_url='https://lakefs.example.io',
    aws_access_key_id='your-access-key',
    aws_secret_access_key='your-secret-key',
    config=config
)
```

Basic Operations

```python
# Upload
s3.put_object(
    Bucket='my-repo',
    Key='main/data/file.csv',
    Body=b'data'
)

# Download
response = s3.get_object(
    Bucket='my-repo',
    Key='main/data/file.csv'
)
data = response['Body'].read()

# List objects
response = s3.list_objects_v2(
    Bucket='my-repo',
    Prefix='main/data/'
)
```

Dev/Test Environments

Branch-Based Isolation

```python
# Create test branch
test_branch = lakefs.repository("my-repo", client=client).branch("test-env")
test_branch.create(source_reference="main")

# Work safely in test environment
df.write.mode('overwrite').parquet('s3a://my-repo/test-env/data')

# Merge to production when ready
test_branch.merge_into("main")
```

CI/CD with Hooks

Data Quality Gates

# actions.yaml

```yaml
name: ParquetOnlyInProduction
on:
  pre-merge:
    branches:
      - main
hooks:
  - id: format_validator
    type: webhook
    properties:
      url: "http://hooks-server:5001/validate"
      query_params:
        allow: ["parquet", "delta_lake"]
```

Migration Guidelines

Single → Multi-Storage

· Set backward_compatible: true for existing storage
· New repositories require explicit storage ID
· Existing repositories continue working unchanged

Multi → Single Storage

1. Dump repository references
2. Delete repositories
3. Configure single storage backend
4. Restore repositories with --ignore-storage-id

Troubleshooting

Common Issues

· Duplicate IDs: Ensure unique id for each storage
· Missing backward_compatible: Required when upgrading from single storage
· Repository conflicts: Remove all repos before deleting storage backend

Validation

```python
# Check storage connectivity
for store in client.storage.list_storages():
    print(f"ID: {store.id}, Type: {store.type}")
```

Best Practices

1. Use descriptive storage IDs
2. Implement pre-merge hooks for data validation
3. Use branch-per-feature for development
4. Monitor storage credentials and permissions
5. Test migrations in non-production first

This condensed guide covers the essential technical information for developers working with lakeFS multiple storage backends, including configuration, API usage, and common workflows.
