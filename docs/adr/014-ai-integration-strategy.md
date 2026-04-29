# ADR 014: AI Integration Strategy and Future Upgrades

## Status
Proposed

## Context
As the HRIS product matures from a foundational database and calculator into an intelligent assistant, there is a strategic need to incorporate AI. Standard HR systems solve the problem of record-keeping and basic compliance, but adding AI solves the problem of *scale*—reducing administrative overhead for HR teams, minimizing costly errors in payroll, and empowering managers.

The current system architecture is a modular monolith, which provides a strong foundation for integrating AI in a phased, pragmatic way without over-complicating the infrastructure. This ADR outlines the specific AI features that will provide the highest ROI for our target market (multi-location companies, factories, complex policy environments) and the technical plan to implement them.

## Decision / Future Upgrades Scope

We will adopt a phased approach to AI integration, focusing initially on high-impact, low-risk features, before moving to predictive analytics and fully automated decision-making.

The planned AI capabilities are:

1. **Context-Aware HR Policy Chatbot (RAG)**
   - **Use Case:** Employees query the bot for policy details (e.g., "What is the overtime rate for a public holiday at Plant B?").
   - **Mechanism:** Retrieval-Augmented Generation (RAG). The AI retrieves the specific policy applicable to that user based on the system's policy resolution hierarchy (`Employee -> Dept -> Location -> Company`) before generating an answer.

2. **Payroll Anomaly & Fraud Detection**
   - **Use Case:** Flagging unusual payroll patterns before the payroll run is finalized (e.g., massive spikes in overtime, incorrect BPJS deductions, duplicate allowances).
   - **Mechanism:** Statistical anomaly detection combined with simple Machine Learning models trained on historical payroll runs.

3. **Smart Recruitment & ATS Automation**
   - **Use Case:** Parsing resumes to extract structured data, scoring candidates against job descriptions, and auto-generating tailored interview questions.
   - **Mechanism:** LLM API integration (e.g., OpenAI, Anthropic, or Gemini) for NLP tasks on document uploads.

4. **Smart Shift & Roster Scheduling**
   - **Use Case:** Auto-generating factory shift rosters that balance maximum legal working hours, approved leaves, and historical production needs.
   - **Mechanism:** Constraint-satisfaction algorithms enhanced by ML to predict staffing needs.

5. **Performance Review Assistant**
   - **Use Case:** Drafting performance reviews for managers by synthesizing attendance data, goal completion, and 360-degree feedback.
   - **Mechanism:** LLM text generation using structured data inputs from the employee's yearly record.

6. **Employee Churn / Flight Risk Prediction**
   - **Use Case:** Flagging employees who have a high probability of resigning based on behavioral patterns (stagnant salary, increased partial absences).
   - **Mechanism:** Predictive classification models (e.g., XGBoost, Random Forest) running asynchronously on data warehouse metrics.

## Implementation Plan

To prevent scope creep and infrastructure bloat, implementation will be staged:

### Phase 1: LLM APIs for Text and NLP (Low Risk, High Visibility)
*Focus: Recruitment parsing and Performance review drafting.*
- **Action:** Integrate a managed LLM API provider (e.g., OpenAI API or Google Gemini API).
- **Architecture:** Create an `ai-service` module or utility wrapper within the modular monolith. This wrapper will handle prompt construction, API rate limiting, and sanitizing PII (Personally Identifiable Information) before sending data to third-party APIs.
- **Data Privacy:** Ensure strict agreements with API providers that data is not used for training, or use a self-hosted open-weights model (like Llama 3) if data sovereignty is a strict requirement for clients.

### Phase 2: RAG for Policy Chatbot (Medium Complexity)
*Focus: Employee self-service.*
- **Action:** Implement a vector database (e.g., pgvector extension in PostgreSQL) to store embeddings of company policies and handbooks.
- **Architecture:** Build an orchestration pipeline. When a user asks a question, the system determines their context (Location, Dept, Role), fetches the relevant policy text via vector search, and feeds it to the LLM to generate the final response.

### Phase 3: Anomaly Detection for Payroll (High Value, Internal Logic)
*Focus: Payroll safety.*
- **Action:** Implement statistical anomaly detection on payroll calculation outputs.
- **Architecture:** Before the `PayrollFinalizationEvent` is emitted, pass the calculated batch through an anomaly detection engine. Initially, this can be deterministic (e.g., Z-score > 3 triggers a warning flag in the UI). Later, it can be upgraded to an ML model (e.g., Isolation Forest) that learns standard variances over time.

### Phase 4: Predictive Analytics (High Complexity)
*Focus: Scheduling and Churn Prediction.*
- **Action:** Export anonymized telemetry to a data warehouse or separate analytical service to train predictive models.
- **Architecture:** Move heavy ML processing out of the core monolith. Use scheduled background jobs (e.g., via BullMQ/Redis) to run predictions weekly and write the "risk scores" or "suggested schedules" back to the core database for the UI to consume.

## Consequences

### Positive
- **Market Differentiation:** Positions the HRIS as a modern, premium product compared to legacy competitors.
- **Scalability:** Significantly reduces the manual workload for HR admins and managers.
- **Error Reduction:** Adds a safety net for complex processes like payroll.

### Negative / Risks
- **Data Privacy:** Sending HR data (PII, salaries) to external LLM providers requires strict security protocols, tenant isolation checks, and legal compliance.
- **Infrastructure Costs:** Running vector databases and paying for LLM API tokens will increase operational costs, which must be factored into the pricing model.
- **Hallucinations:** Chatbots might give incorrect policy advice. RAG implementations must be strictly grounded and include disclaimers.

## References
- [HRIS System Plan](../hris-system-plan.md)
- [ADR 008: Policy Resolution Strategy](./008-policy-resolution-strategy.md)
- [ADR 011: Payroll Calculation Order](./011-payroll-calculation-order.md)
