#!/bin/bash

# Script to create Vue.js project folder structure
# Usage: ./create-project-structure.sh <project-name>

PROJECT_NAME=${1:-"new-vuejs-project"}

echo "Creating project structure for: $PROJECT_NAME"

# Create root directory
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Create main directories
mkdir -p public/fonts
mkdir -p public/img/{avatars,brand,car,card}
mkdir -p public/models

# Create src structure
mkdir -p src/assets/avatars
mkdir -p src/assets/banner
mkdir -p src/assets/css
mkdir -p src/assets/icons/banks
mkdir -p src/assets/prints
mkdir -p src/assets/scss/vendors
mkdir -p src/assets/signature

mkdir -p src/containers

mkdir -p src/mixins

mkdir -p src/projects/components/{dialog,Filter,Util}
mkdir -p src/projects/views/dashboards

mkdir -p src/router/middlewares

mkdir -p src/service

mkdir -p src/store/lang
mkdir -p src/store/modules/{Accounts,Applications,Authentication,Dialog,organization,Payments,Setting}

mkdir -p src/views/apps/{email,invoicing}
mkdir -p src/views/{base,buttons,charts,editors,forms,icons,notifications,pages,plugins,tables,theme,users,widgets}

# Create tests structure
mkdir -p tests/e2e/{custom-assertions,custom-commands,page-objects,specs}
mkdir -p tests/unit/{containers,views}

echo "✓ Folder structure created successfully!"
echo ""
echo "Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. npm init or create your package.json"
echo "3. Add your configuration files (babel.config.js, vue.config.js, etc.)"
