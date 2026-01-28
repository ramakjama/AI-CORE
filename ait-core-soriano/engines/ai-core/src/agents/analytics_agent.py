"""
AI-Analytics Agent: Specialized agent for business intelligence and data analytics.

Capabilities:
- Data analysis and insights
- Dashboard recommendations
- KPI tracking
- Report generation
- Trend analysis
- Predictive analytics
"""

from typing import Dict, Any, Optional, List
from ..orchestrator import TaskType
from .base_agent import BaseAgent, AgentResponse


class AnalyticsAgent(BaseAgent):
    """AI agent specialized for business analytics and BI."""

    name = "analytics_agent"
    description = "AI assistant for business intelligence and data analytics"
    default_task_type = TaskType.DATA_ANALYSIS

    def _default_system_prompt(self) -> str:
        return """You are an expert data analyst and BI specialist integrated into AI-Analytics.

Your capabilities include:
- Analyzing business data for insights
- Creating dashboards and visualizations
- Tracking and reporting KPIs
- Identifying trends and patterns
- Predictive analytics and forecasting
- Generating executive reports

Guidelines:
1. Provide actionable, data-driven insights
2. Use clear visualizations to communicate findings
3. Consider business context in all analyses
4. Highlight significant trends and anomalies
5. Provide confidence levels for predictions
6. Make recommendations based on data"""

    async def analyze_data(
        self,
        data_description: str,
        questions: List[str],
        data_sample: Optional[str] = None,
    ) -> AgentResponse:
        """
        Analyze data and answer business questions.

        Args:
            data_description: Description of the data
            questions: Business questions to answer
            data_sample: Sample of the data

        Returns:
            Analysis with answers
        """
        questions_str = "\n".join([f"- {q}" for q in questions])
        sample_str = f"\nData sample:\n{data_sample}" if data_sample else ""

        prompt = f"""Analyze this data:

{data_description}
{sample_str}

Answer these questions:
{questions_str}

Provide:
1. Direct answers to each question
2. Supporting analysis and calculations
3. Key insights discovered
4. Recommended actions
5. Suggested visualizations"""

        return await self.chat(prompt, use_rag=True)

    async def recommend_dashboard(
        self,
        business_context: str,
        available_metrics: List[str],
        user_role: str = "executive",
    ) -> AgentResponse:
        """
        Recommend dashboard design.

        Args:
            business_context: Business context and goals
            available_metrics: Available metrics to display
            user_role: Target user role

        Returns:
            Dashboard recommendations
        """
        metrics_str = ", ".join(available_metrics)

        prompt = f"""Design a dashboard for:

Context: {business_context}
User role: {user_role}
Available metrics: {metrics_str}

Provide:
1. Dashboard layout recommendation
2. Key metrics to highlight
3. Chart types for each metric
4. Filters and interactivity
5. Color scheme and visual hierarchy
6. Alert thresholds"""

        return await self.chat(prompt, use_rag=True)

    async def generate_report(
        self,
        report_type: str,
        data_summary: str,
        period: str = "monthly",
        audience: str = "executives",
    ) -> AgentResponse:
        """
        Generate a business report.

        Args:
            report_type: Type of report (sales, financial, operational)
            data_summary: Summary of the data
            period: Reporting period
            audience: Target audience

        Returns:
            Generated report
        """
        prompt = f"""Generate a {period} {report_type} report for {audience}:

Data summary:
{data_summary}

Include:
1. Executive summary
2. Key metrics and KPIs
3. Performance vs targets
4. Trend analysis
5. Notable achievements/concerns
6. Recommendations
7. Next period outlook"""

        return await self.chat(prompt, use_rag=True)

    async def identify_trends(
        self,
        data_description: str,
        time_period: str,
        metrics: List[str],
    ) -> AgentResponse:
        """
        Identify trends in data.

        Args:
            data_description: Description of the data
            time_period: Time period to analyze
            metrics: Metrics to analyze

        Returns:
            Trend analysis
        """
        metrics_str = ", ".join(metrics)

        prompt = f"""Identify trends in this data:

Data: {data_description}
Period: {time_period}
Metrics: {metrics_str}

Provide:
1. Overall trends for each metric
2. Seasonal patterns
3. Anomalies or outliers
4. Correlations between metrics
5. Trend drivers
6. Future projections"""

        return await self.chat(prompt, use_rag=False)

    async def define_kpis(
        self,
        business_objectives: str,
        department: str,
    ) -> AgentResponse:
        """
        Define KPIs for business objectives.

        Args:
            business_objectives: Business objectives
            department: Department or area

        Returns:
            KPI definitions
        """
        prompt = f"""Define KPIs for:

Objectives: {business_objectives}
Department: {department}

For each KPI, provide:
1. KPI name and definition
2. Formula/calculation
3. Target value
4. Measurement frequency
5. Data source
6. Benchmark comparison"""

        return await self.chat(prompt, use_rag=True)

    async def predict_forecast(
        self,
        historical_data: str,
        forecast_period: str,
        variables: List[str],
    ) -> AgentResponse:
        """
        Generate predictions and forecasts.

        Args:
            historical_data: Historical data description
            forecast_period: Period to forecast
            variables: Variables to forecast

        Returns:
            Forecast with confidence intervals
        """
        vars_str = ", ".join(variables)

        prompt = f"""Create a forecast:

Historical data: {historical_data}
Forecast period: {forecast_period}
Variables: {vars_str}

Provide:
1. Forecasted values
2. Confidence intervals
3. Methodology used
4. Key assumptions
5. Risk factors
6. Scenario analysis (best/worst/likely)"""

        return await self.chat(prompt, use_rag=False)
