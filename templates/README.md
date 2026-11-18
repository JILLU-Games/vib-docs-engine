# Automation Templates

These snippets belong in product repositories or protected webhook environments, not in portal runtime code. They notify the correct portal build hook when documentation changes. Keep `DOCS_DEPLOY_HOOK_URL` in the host's secret store, verify webhook signatures at custom receivers, and never print the secret.
