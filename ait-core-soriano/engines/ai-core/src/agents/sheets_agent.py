"""
AI-Sheets Agent: Specialized agent for spreadsheet operations and data analysis.

Capabilities:
- Generate formulas from natural language
- Analyze data and provide insights
- Create charts and visualizations
- Clean and transform data
- Predict trends and forecasting
- Generate pivot table recommendations
"""

from typing import Dict, Any, Optional, List
from ..orchestrator import TaskType
from .base_agent import BaseAgent, AgentResponse


class SheetsAgent(BaseAgent):
    """AI agent specialized for spreadsheet and data analysis operations."""

    name = "sheets_agent"
    description = "AI assistant for spreadsheets, data analysis, and formulas"
    default_task_type = TaskType.DATA_ANALYSIS

    def _default_system_prompt(self) -> str:
        return """You are an expert data analyst and spreadsheet specialist integrated into AI-Sheets.

Your capabilities include:
- Writing Excel/Google Sheets formulas from natural language
- Analyzing data to find patterns and insights
- Recommending visualizations and charts
- Cleaning and transforming data
- Forecasting and trend analysis
- Creating pivot tables and summaries

Guidelines:
1. When writing formulas, use standard Excel/Sheets syntax
2. Explain formulas clearly so users understand them
3. Consider data types and edge cases in formulas
4. Provide actionable insights from data analysis
5. Recommend appropriate chart types for the data
6. Handle errors gracefully in formulas

Formula syntax notes:
- Use Excel-compatible syntax (works in most spreadsheets)
- Include cell references like A1, B2:B100, etc.
- Use common functions: SUM, AVERAGE, VLOOKUP, IF, SUMIF, etc.
- For arrays, use appropriate array formulas

When analyzing data:
- Look for trends, outliers, and patterns
- Calculate relevant statistics
- Provide clear, actionable recommendations
- Visualize findings when helpful"""

    async def formula(
        self,
        description: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> AgentResponse:
        """
        Generate a formula from natural language.

        Args:
            description: What the formula should do
            context: Optional context (column names, data types, etc.)

        Returns:
            Formula with explanation
        """
        context_info = ""
        if context:
            if "columns" in context:
                context_info += f"\nAvailable columns: {', '.join(context['columns'])}"
            if "data_range" in context:
                context_info += f"\nData range: {context['data_range']}"
            if "sample_data" in context:
                context_info += f"\nSample data: {context['sample_data']}"

        prompt = f"""Create a spreadsheet formula for the following request:

{description}
{context_info}

Provide:
1. The formula (Excel-compatible syntax)
2. Brief explanation of how it works
3. Any assumptions made
4. Example of expected result"""

        return await self.chat(prompt, context=context, use_rag=False)

    async def analyze(
        self,
        data_description: str,
        data_sample: Optional[str] = None,
        analysis_type: str = "general",
    ) -> AgentResponse:
        """
        Analyze data and provide insights.

        Args:
            data_description: Description of the data
            data_sample: Sample of the actual data
            analysis_type: Type of analysis (general, trends, comparison, etc.)

        Returns:
            Analysis insights and recommendations
        """
        data_section = f"\nSample data:\n{data_sample}" if data_sample else ""

        analysis_instructions = {
            "general": "Provide a comprehensive analysis covering key patterns, statistics, and recommendations.",
            "trends": "Focus on identifying trends, growth patterns, and changes over time.",
            "comparison": "Compare different segments or categories in the data.",
            "outliers": "Identify and explain any outliers or anomalies.",
            "forecasting": "Analyze patterns and provide forecasts for future values.",
        }

        prompt = f"""Analyze the following data:

Description: {data_description}
{data_section}

Analysis focus: {analysis_instructions.get(analysis_type, analysis_instructions['general'])}

Provide:
1. Key findings and insights
2. Relevant statistics and calculations
3. Patterns or trends identified
4. Actionable recommendations
5. Suggested visualizations"""

        return await self.chat(prompt, use_rag=False)

    async def chart_recommendation(
        self,
        data_description: str,
        goal: str = "visualize trends",
    ) -> AgentResponse:
        """
        Recommend the best chart type for the data.

        Args:
            data_description: Description of the data
            goal: What you want to show with the chart

        Returns:
            Chart recommendations with configuration
        """
        prompt = f"""Recommend the best chart type for this data:

Data: {data_description}
Goal: {goal}

Provide:
1. Recommended chart type (and alternatives)
2. Which columns/data to use for each axis
3. Suggested formatting and colors
4. Tips for making the chart effective
5. Any caveats or considerations"""

        return await self.chat(prompt, use_rag=False)

    async def clean_data(
        self,
        issues_description: str,
        data_sample: Optional[str] = None,
    ) -> AgentResponse:
        """
        Suggest data cleaning steps.

        Args:
            issues_description: Description of data quality issues
            data_sample: Sample of problematic data

        Returns:
            Data cleaning recommendations and formulas
        """
        data_section = f"\nSample data with issues:\n{data_sample}" if data_sample else ""

        prompt = f"""Help clean the following data:

Issues: {issues_description}
{data_section}

Provide:
1. Step-by-step cleaning process
2. Specific formulas for each cleaning step
3. How to handle edge cases
4. Validation checks to ensure data quality
5. Prevention tips for future data entry"""

        return await self.chat(prompt, use_rag=False)

    async def pivot_suggestion(
        self,
        data_description: str,
        questions: List[str],
    ) -> AgentResponse:
        """
        Suggest pivot table configurations.

        Args:
            data_description: Description of the data
            questions: Business questions to answer

        Returns:
            Pivot table configurations
        """
        questions_str = "\n".join([f"- {q}" for q in questions])

        prompt = f"""Suggest pivot table configurations for this data:

Data description: {data_description}

Questions to answer:
{questions_str}

For each question, provide:
1. Recommended pivot table structure
2. Row, column, and value fields
3. Aggregation functions to use
4. Any filters to apply
5. Additional calculations or derived fields"""

        return await self.chat(prompt, use_rag=False)

    async def forecast(
        self,
        data_description: str,
        historical_data: Optional[str] = None,
        forecast_periods: int = 12,
    ) -> AgentResponse:
        """
        Generate forecasts based on historical data.

        Args:
            data_description: Description of the data
            historical_data: Historical values
            forecast_periods: Number of periods to forecast

        Returns:
            Forecast with methodology explanation
        """
        data_section = f"\nHistorical data:\n{historical_data}" if historical_data else ""

        prompt = f"""Create a forecast for the following:

Data: {data_description}
{data_section}

Forecast {forecast_periods} periods ahead.

Provide:
1. Forecasted values with confidence intervals
2. Methodology used (trend analysis, seasonal adjustment, etc.)
3. Key assumptions
4. Factors that could affect accuracy
5. Spreadsheet formulas for implementing the forecast"""

        return await self.chat(prompt, use_rag=False)

    async def explain_formula(
        self,
        formula: str,
    ) -> AgentResponse:
        """
        Explain what a formula does.

        Args:
            formula: The formula to explain

        Returns:
            Detailed explanation
        """
        prompt = f"""Explain this spreadsheet formula in detail:

{formula}

Include:
1. What the formula does (in plain English)
2. Breakdown of each function used
3. How the components work together
4. Expected input and output
5. Common use cases for this formula
6. Potential issues or edge cases to watch for"""

        return await self.chat(prompt, use_rag=False)

    async def generate_report(
        self,
        data_description: str,
        report_type: str = "summary",
    ) -> AgentResponse:
        """
        Generate a data report structure.

        Args:
            data_description: Description of the data
            report_type: Type of report (summary, detailed, executive)

        Returns:
            Report structure with calculations
        """
        prompt = f"""Create a {report_type} report structure for this data:

{data_description}

Provide:
1. Report sections and their purposes
2. Key metrics and calculations for each section
3. Formulas needed for calculations
4. Recommended visualizations
5. Executive summary template"""

        return await self.chat(prompt, use_rag=False)
