# Roadmap

This file is the concise execution view. The detailed reasoning lives in [docs/IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). The live backlog lives in [docs/TODO.md](TODO.md).

## Current status

### Landed
- shared tenant-aware runtime foundation
- territory and account runtime surfaces
- tenant login routing
- template-driven onboarding v1
- workspace/package manifests wired into the runtime
- in-app screen-comment change capture with annotated screenshots
- PICC runtime workflows for PPP savings and mock proposals
- FraterniTees runtime onboarding, Printavo sync, and lead-scoring surfaces
- geocoding flow with open-source default and Google upgrade path
- sync status, runtime APIs, and base verification loops

### In progress
- keeping the repo docs aligned with the new control-plane surfaces
- extraction of tenant behavior into clearer reusable contracts
- broadening self-serve onboarding and connector depth beyond the first template
- adding policy/preview layers on top of the new screenshot-first change-request queue

### Next critical outcomes
- broader primitive extraction
- more compiled score/trend/read-model outputs
- onboarding improvements for additional templates
- change-request preview/policy model on top of screen-comment capture
- more tenant behavior extraction from shared code

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
- screenshot/annotation intake
- classifier/policy
- previewable config/package changes
- maintainer queue for new primitives/core work

### 6. Turn solved tenant shapes into reusable templates/packages
- template export/import
- package registry
- upgrade/versioning path
