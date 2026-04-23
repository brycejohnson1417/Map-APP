# Roadmap

This file is the concise execution view. The detailed reasoning lives in [docs/IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). The live backlog lives in [docs/TODO.md](TODO.md).

## Current status

### Landed
- shared tenant-aware runtime foundation
- territory and account runtime surfaces
- tenant login routing
- PICC runtime workflows for PPP savings and mock proposals
- FraterniTees runtime onboarding, Printavo sync, and lead-scoring surfaces
- geocoding flow with open-source default and Google upgrade path
- sync status, runtime APIs, and base verification loops

### In progress
- platform documentation rewrite around the harness/package/workspace model
- extraction of tenant behavior into clearer reusable contracts
- FraterniTees scoring/filter/trend refinement

### Next critical outcomes
- primitive catalog v1
- workspace/package model v1
- tenant behavior extraction from shared code
- compiled score/trend/read-model outputs
- self-serve onboarding path
- change-request queue and policy model

## Sequence

### 1. Clarify the platform in the repo
- status
- strategy
- architecture
- workspace model
- primitive catalog

### 2. Extract current tenant behavior
- FraterniTees lead scoring/filtering/trends
- PICC tenant-specific modules
- registry-style filters and modules

### 3. Harden platform contracts
- canonical runtime contracts
- package/workspace manifests
- adapter boundaries
- read-model outputs

### 4. Build self-serve tenant setup
- templates
- provider installs
- initial sync
- workspace bootstrap

### 5. Build governed tenant adaptation
- request capture
- classifier/policy
- previewable config/package changes
- maintainer queue for new primitives/core work

### 6. Turn solved tenant shapes into reusable templates/packages
- template export/import
- package registry
- upgrade/versioning path
