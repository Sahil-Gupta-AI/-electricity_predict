import * as fs from 'fs';
import * as path from 'path';
import git from 'isomorphic-git';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = __dirname;

async function setupGit() {
  try {
    console.log('Initializing git repository...');
    
    // Check if .git already exists
    const gitDirPath = path.join(projectDir, '.git');
    if (!fs.existsSync(gitDirPath)) {
      await git.init({ fs, dir: projectDir });
      console.log('✓ Git repository initialized');
    } else {
      console.log('✓ Git repository already exists');
    }
    
    // Configure git user
    await git.setConfig({
      fs,
      dir: projectDir,
      path: 'user.name',
      value: 'Prashant Ambokar'
    });
    
    await git.setConfig({
      fs,
      dir: projectDir,
      path: 'user.email',
      value: 'your-email@example.com'
    });
    console.log('✓ Git user configured');
    
    // Create .gitignore if it doesn't exist
    const gitignorePath = path.join(projectDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log
yarn-error.log
.pnpm-debug.log

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
.vite/
.turbo/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Testing
coverage/
.nyc_output/

# Misc
.cache/
*.log
setup-git.js
`;
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log('✓ .gitignore created');
    }

    // Get all files to add
    console.log('Adding files to git...');
    const files = getAllFilesRecursive(projectDir, ['.git', 'node_modules', '.vscode', 'dist', 'build']);
    
    let filesAdded = 0;
    for (const file of files) {
      const relPath = path.relative(projectDir, file).replace(/\\\\/g, '/');
      // Skip .git and other ignored files
      if (!relPath.startsWith('.git') && !relPath.includes('node_modules') && !relPath.includes('.vscode')) {
        try {
          await git.add({ fs, dir: projectDir, filepath: relPath });
          filesAdded++;
        } catch (e) {
          // Skip if file is in ignored path
        }
      }
    }
    console.log(`✓ Files staged (${filesAdded} files)`);

    // Create initial commit
    try {
      const commitHash = await git.commit({
        fs,
        dir: projectDir,
        message: 'Initial commit: Electricity Analyser Project',
        author: {
          name: 'Prashant Ambokar',
          email: 'your-email@example.com'
        }
      });
      console.log('✓ Initial commit created:', commitHash.substring(0, 7));
    } catch (e) {
      console.log('ℹ Commit note:', e.message);
    }

    console.log('\n✅ Git setup complete!');
    console.log('\n📋 Next Steps to Push to GitHub:');
    console.log('\n1. Install Git for Windows:');
    console.log('   Download from: https://git-scm.com/download/win');
    console.log('\n2. Create a GitHub repository:');
    console.log('   Visit: https://github.com/new');
    console.log('\n3. Run these commands in your terminal:');
    console.log('');
    console.log('   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git');
    console.log('   git branch -M main');
    console.log('   git push -u origin main');
    console.log('\n   Replace YOUR_USERNAME and YOUR_REPO_NAME with your GitHub account details');
    
  } catch (err) {
    console.error('❌ Error setting up git:', err.message);
    process.exit(1);
  }
}

function getAllFilesRecursive(dir, excludeDirs = []) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip excluded directories
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name) && !entry.name.includes('node_modules')) {
          files.push(...getAllFilesRecursive(fullPath, excludeDirs));
        }
      } else {
        if (!excludeDirs.some(exclude => entry.name.includes(exclude))) {
          files.push(fullPath);
        }
      }
    }
  } catch (e) {
    // Silently skip errors reading directories
  }
  
  return files;
}

setupGit();
