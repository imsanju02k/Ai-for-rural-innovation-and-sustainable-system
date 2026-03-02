# Contributing to AWS Backend Infrastructure

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone <your-fork-url>
   cd aws-backend-infrastructure
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Run linter before committing: `npm run lint`
- Format code with Prettier: `npm run format`

## Commit Messages

Follow conventional commits format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions or changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

Example:
```
feat: add Lambda authorizer for API Gateway
```

## Testing

### Unit Tests

- Write unit tests for all utilities and constructs
- Aim for 80%+ code coverage
- Use descriptive test names

```typescript
describe('validateEnvironment', () => {
  it('should accept valid environment names', () => {
    const result = validateEnvironment('dev');
    expect(result.valid).toBe(true);
  });
});
```

### Integration Tests

- Test actual AWS service interactions
- Use separate test AWS account if possible
- Clean up resources after tests

### Property-Based Tests

- Use fast-check for property-based testing
- Test invariants and properties
- Run with minimum 100 iterations

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Add tests for new functionality
4. Run tests: `npm test`
5. Run linter: `npm run lint`
6. Commit with conventional commit message
7. Push to your fork
8. Create a pull request

## Pull Request Checklist

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts
- [ ] PR description explains changes

## Code Review

- All PRs require at least one approval
- Address review comments promptly
- Keep PRs focused and reasonably sized
- Squash commits before merging

## Questions?

Open an issue for questions or discussions.
