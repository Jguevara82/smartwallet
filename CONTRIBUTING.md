# Contributing to SmartWallet

Thank you for your interest in contributing to SmartWallet! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. Follow the setup instructions in [README.md](README.md)

## 📋 Development Workflow

### Creating a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bugfix branch
git checkout -b fix/issue-description
```

### Making Changes

1. Write clean, readable code
2. Follow existing code patterns and conventions
3. Add comments for complex logic
4. Test your changes locally

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add budget alerts notification
fix: correct transaction date formatting
docs: update API documentation
refactor: simplify auth middleware
```

### Pull Request

1. Push your branch to your fork
2. Open a PR against the `main` branch
3. Fill out the PR template
4. Wait for review

## 📁 Code Structure

### Backend

- `/src/routes/` - API route handlers
- `/src/middleware/` - Express middleware
- `/prisma/` - Database schema and migrations

### Frontend

- `/src/pages/` - React page components
- `/src/context/` - React context providers
- `/src/services/` - API client and utilities

## 🎨 Code Style

### JavaScript/React

- Use functional components with hooks
- Prefer `const` over `let`
- Use async/await for promises
- Destructure props and state

### CSS

- Use TailwindCSS utilities
- Avoid custom CSS unless necessary
- Follow mobile-first approach

## 🧪 Testing

Before submitting:

1. Test all modified features
2. Verify no console errors
3. Check responsive design
4. Test authentication flows

## 📝 Documentation

- Update README if adding new features
- Add JSDoc comments for complex functions
- Update API documentation for new endpoints

## 🐛 Reporting Issues

When reporting issues, include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/OS information
- Screenshots if applicable

## 💡 Feature Requests

Feature requests are welcome! Please:

- Check existing issues first
- Describe the use case
- Explain expected behavior
- Consider implementation complexity

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.
