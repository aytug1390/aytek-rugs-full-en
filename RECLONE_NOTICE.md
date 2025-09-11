Repository history rewritten — RECLONE REQUIRED

Why

Sensitive environment variables were found in the repository history and have been removed from the git history. As a result a force-push was performed which rewrote repository history.

What you must do (everyone)

1) Delete your existing local clones for this repository.
2) Re-clone the repository:

   git clone https://github.com/aytug1390/aytek-rugs-full-en.git

3) Recreate any local branches you were working on and reapply local changes (pulls from old history will not work).

If you have an open PR that points to commits from the old history:
- Close and reopen the PR, or rebase your branch onto the updated target branch and force-push your branch.

Security steps performed

- History was cleaned of environment files; local backups were moved to a secure archive on disk.
- Please confirm that production/staging secrets have been rotated and updated in the deployment platform and GitHub Secrets.

Notes for admins

- Re-enable branch protection rules if you temporarily relaxed them for the cleanup.
- If you need help purging additional paths from history, follow the GIT_PURGE_RUNBOOK.md in the repo.

Contact

If you need help: ping @ops or the repository owner in the team chat.
