"""
AI-Code Agent: Specialized agent for code assistance and development.

Capabilities:
- Code generation from descriptions
- Code explanation and documentation
- Bug detection and fixing
- Code review and optimization
- Refactoring suggestions
- Test generation
"""

from typing import Dict, Any, Optional, List
from ..orchestrator import TaskType
from .base_agent import BaseAgent, AgentResponse


class CodeAgent(BaseAgent):
    """AI agent specialized for coding assistance."""

    name = "code_agent"
    description = "AI assistant for code generation, review, and development"
    default_task_type = TaskType.CODE_GENERATION

    def _default_system_prompt(self) -> str:
        return """You are an expert software developer integrated into AI-Code.

Your capabilities include:
- Writing code in any programming language
- Explaining complex code
- Debugging and fixing issues
- Code review and optimization
- Writing tests
- Refactoring code
- Generating documentation

Guidelines:
1. Write clean, readable, and well-documented code
2. Follow best practices and design patterns
3. Consider edge cases and error handling
4. Optimize for performance when appropriate
5. Explain your reasoning when making design decisions
6. Suggest improvements proactively

When writing code:
- Add appropriate comments
- Use meaningful variable and function names
- Handle errors gracefully
- Consider security implications"""

    async def generate_code(
        self,
        description: str,
        language: str = "python",
        context: Optional[str] = None,
    ) -> AgentResponse:
        """
        Generate code from a description.

        Args:
            description: What the code should do
            language: Programming language
            context: Existing code context

        Returns:
            Generated code with explanation
        """
        context_str = f"\nExisting code context:\n```{language}\n{context}\n```" if context else ""

        prompt = f"""Generate {language} code for the following:

{description}
{context_str}

Provide:
1. The complete code implementation
2. Brief explanation of the approach
3. Usage example
4. Any important notes or caveats"""

        return await self.chat(prompt, use_rag=True)

    async def explain_code(
        self,
        code: str,
        language: str = "auto",
        detail_level: str = "medium",
    ) -> AgentResponse:
        """
        Explain what code does.

        Args:
            code: Code to explain
            language: Programming language (auto-detect if not specified)
            detail_level: How detailed (brief, medium, detailed)

        Returns:
            Code explanation
        """
        prompt = f"""Explain this code ({detail_level} detail level):

```{language}
{code}
```

Include:
1. Overall purpose
2. How it works step by step
3. Key functions/methods and their roles
4. Any important patterns or techniques used
5. Potential improvements or considerations"""

        return await self.chat(prompt, use_rag=False)

    async def review_code(
        self,
        code: str,
        language: str = "auto",
        focus_areas: Optional[List[str]] = None,
    ) -> AgentResponse:
        """
        Review code for issues and improvements.

        Args:
            code: Code to review
            language: Programming language
            focus_areas: Specific areas to focus on

        Returns:
            Code review with suggestions
        """
        focus_str = f"\nFocus areas: {', '.join(focus_areas)}" if focus_areas else ""

        prompt = f"""Review this code:

```{language}
{code}
```
{focus_str}

Analyze:
1. Code quality and readability
2. Potential bugs or issues
3. Security vulnerabilities
4. Performance considerations
5. Best practices compliance
6. Suggested improvements

Rate overall quality (1-10) and prioritize issues by severity."""

        return await self.chat(prompt, use_rag=False)

    async def fix_bug(
        self,
        code: str,
        error_message: Optional[str] = None,
        expected_behavior: Optional[str] = None,
    ) -> AgentResponse:
        """
        Find and fix bugs in code.

        Args:
            code: Buggy code
            error_message: Error message if available
            expected_behavior: What the code should do

        Returns:
            Fixed code with explanation
        """
        error_str = f"\nError message:\n{error_message}" if error_message else ""
        expected_str = f"\nExpected behavior: {expected_behavior}" if expected_behavior else ""

        prompt = f"""Fix the bug in this code:

```
{code}
```
{error_str}
{expected_str}

Provide:
1. The bug identification
2. Root cause analysis
3. Fixed code
4. Explanation of the fix
5. How to prevent similar bugs"""

        return await self.chat(prompt, use_rag=False)

    async def generate_tests(
        self,
        code: str,
        language: str = "python",
        framework: str = "pytest",
    ) -> AgentResponse:
        """
        Generate unit tests for code.

        Args:
            code: Code to test
            language: Programming language
            framework: Testing framework

        Returns:
            Test code
        """
        prompt = f"""Generate {framework} tests for this {language} code:

```{language}
{code}
```

Include:
1. Unit tests for all functions/methods
2. Edge cases and boundary conditions
3. Error handling tests
4. Mock/stub setup if needed
5. Test documentation"""

        return await self.chat(prompt, use_rag=False)

    async def refactor(
        self,
        code: str,
        goals: Optional[List[str]] = None,
    ) -> AgentResponse:
        """
        Suggest and perform code refactoring.

        Args:
            code: Code to refactor
            goals: Refactoring goals

        Returns:
            Refactored code with explanation
        """
        goals_str = f"\nRefactoring goals: {', '.join(goals)}" if goals else ""

        prompt = f"""Refactor this code:

```
{code}
```
{goals_str}

Provide:
1. Refactored code
2. List of changes made
3. Explanation of improvements
4. Before/after comparison of key metrics
5. Any trade-offs to consider"""

        return await self.chat(prompt, use_rag=False)

    async def document_code(
        self,
        code: str,
        style: str = "docstring",
    ) -> AgentResponse:
        """
        Generate documentation for code.

        Args:
            code: Code to document
            style: Documentation style (docstring, markdown, jsdoc)

        Returns:
            Documented code
        """
        prompt = f"""Add {style} documentation to this code:

```
{code}
```

Include:
1. Module/file level documentation
2. Class documentation (if applicable)
3. Function/method documentation with:
   - Description
   - Parameters
   - Return values
   - Exceptions
   - Examples
4. Inline comments for complex logic"""

        return await self.chat(prompt, use_rag=False)

    async def convert_language(
        self,
        code: str,
        source_language: str,
        target_language: str,
    ) -> AgentResponse:
        """
        Convert code from one language to another.

        Args:
            code: Code to convert
            source_language: Original language
            target_language: Target language

        Returns:
            Converted code
        """
        prompt = f"""Convert this {source_language} code to {target_language}:

```{source_language}
{code}
```

Provide:
1. Converted code using {target_language} idioms
2. Notes on any functionality differences
3. Required imports/dependencies
4. Any manual adjustments needed"""

        return await self.chat(prompt, use_rag=False)
