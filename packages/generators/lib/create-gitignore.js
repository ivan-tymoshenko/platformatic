'use strict'

const gitignore = `\
dist
.DS_Store

# dotenv environment variable files
.env

# database files
*.sqlite
*.sqlite3

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Dependency directories
node_modules/

# ctags
tags

# clinicjs
.clinic/
`
function generateGitignore () {
  return {
    path: '',
    file: '.gitignore',
    contents: gitignore
  }
}

module.exports = {
  generateGitignore
}