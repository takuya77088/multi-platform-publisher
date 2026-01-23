---
title: "Running Regression Tests Without Opening a GUI: Implementation Example"
published: true
tags: ["API Automation Testing", "Skills", "Regression Testing", "Apidog"]
---


To be honest, my team also had API automated tests. But they were in a state of "we have them, but they're hard to use."

Where are the test scenarios? Which one should I run? How do I write the command? How do I switch environments? How do I view the report after execution? These small steps piled up, turning regression testing from "something quick" into "something that requires set-aside time."

In this article, I’ll introduce the workflow I actually use in my local environment. It combines [**Apidog**](https://www.apidog.com/?utm_source=opr&utm_medium=a2devto1&utm_content=claude-skills-automation)'s automated test assets (scenarios/test suites) with **Claude**'s terminal capabilities to execute API automated tests with a single natural language command:

> **"Run regression testing for 01_e2e_happy_path in the dev environment. Once completed, summarize the results with these 4 points: pass rate, failed test cases, estimated cause of failure, and suggested fix procedures."**

Claude Code automatically matches the request with Claude Skills, identifies the corresponding test, and executes the **Apidog CLI**. Finally, it summarizes the results into a readable conclusion. This combination is particularly suitable for **API automation testing**, **regression testing**, and integrating testing into your daily development flow.


![](https://raw.githubusercontent.com/takuya77088/multi-platform-publisher/main/images/260123-skill-3e.png)

## Why We Need to "Naturalize" API Automated Testing

In many teams, automated tests have enough "execution capability" but lack "usability":

*   Newcomers don't know what tests are available or which ones to run.
*   CLI commands are too long, making environment parameters easy to mess up.
*   Checking logs or viewing reports after a test failure incurs communication costs.
*   It's difficult to quickly run regression tests before committing or merging.

The value of triggering tests with natural language is that it lowers the barrier to "test execution" to the level of speaking a sentence, while utilizing the robust test structure and reporting capabilities of a specialized tool ([Apidog](https://www.apidog.com/?utm_source=opr&utm_medium=a2devto1&utm_content=claude-skills-automation)).

 

## The Big Picture: Role of Apidog × Claude Components

This workflow consists of three components:

*   **Apidog CLI**: Executes Apidog test scenarios/suites and outputs CLI/HTML reports.
*   **Claude Code**: An AI assistant in the terminal capable of running commands, file operations, and executing scripts.
*   **Claude Skills (Agent Skills)**: Gives Claude an "executable flow," teaching it how to select tests, switch environments, execute the CLI, and summarize results.

In short:

> Natural Language → Claude matches Skill → Calls script to run Apidog CLI → Parses output → Summarizes conclusion

 

## Preparation

To run Apidog CLI and Claude Code, you first need to prepare a Node environment and complete the installation.

### 1) Environment Requirement: Node.js

Node 18+ or 20+ is recommended. Check in your terminal:

```bash
node -v
npm -v
```

### 2) Install Apidog CLI

```bash
npm install -g apidog-cli
apidog --version
```

If the version number is displayed, the installation is successful.

### 3) Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
claude --version
claude   # Follow prompts to login on first run
```

 

## Organizing Test Assets: Example with AI-Generated Demo App

For verification purposes, I created a simple E-commerce site demo using AI (local environment `http://127.0.0.1:3001`). To confirm "reliability" and "stable reproducibility," I prepared the following two types of tests for this demo app:

*   **01_e2e_happy_path (E2E Happy Path)**
    The main happy path flow (Login → Product List → Create Order → Payment). If the local environment is operating normally, this guarantees that the sequence of a user shopping functions correctly.

*   **02_payment_should_fail (Boundary/Failure Test)**
    Failure scenarios under specific conditions (e.g., setting where orders over 6000 yen cause a payment error). This is used to demonstrate if AI can correctly analyze the cause from logs when "test failure" is detected.


**Why is the filename important?**
By including "meaning (context)" in the filename, Claude can infer the appropriate test even from vague natural language instructions.
For example, if you name it `02_payment_should_fail`, you don't need to specify the exact filename. Just saying "Check the payment failure patterns" or "Regression for payment," helps Claude understand "Ah, this is the one" and pick up the intent. This is the trick to realizing "Conversational Test Execution."

 

## Implementing Claude Skills: Committing "How to Run Tests" to the Repo

The advantage of Claude Skills is that it turns execution flows into version-controllable, reviewable project assets. They don't get scattered through oral tradition.

A minimal usable Skill directory looks like this:

*   `.claude/skills/apidog-tests/`
    *   `SKILL.md`: Trigger conditions + Execution flow (Core)
    *   `env/`: Tokens/envIds for different environments (Do not commit secrets to Git)
    *   `tests/`: Markdown files for each test (Stores CLI commands)
    *   `scripts/`: Assembles and runs the CLI (Reduces context and manual command assembly costs)

![](https://raw.githubusercontent.com/takuya77088/multi-platform-publisher/main/images/260123-skill-1e.png)

Benefits of this organization:

*   Apidog continues to handle test scenario/suite maintenance.
*   The Skill handles "Selection Logic + Environment Management + Execution Standards + Output Summarization."
*   Team members don't need to remember commands; they just need to state their requirements.

 

## Apidog CLI: The Execution Engine (Skills are just "Wrapping & Automation")

![](https://raw.githubusercontent.com/takuya77088/multi-platform-publisher/main/images/260123-apidog-3e.png)


You can copy the CLI command directly from the [Apidog](https://www.apidog.com/?utm_source=opr&utm_medium=a2devto1&utm_content=claude-skills-automation) test scenario/suite page (CI/CD or CLI area).

A typical format looks like this:

```bash
apidog run --access-token <TOKEN> -t <SCENARIO_ID> -e <ENV_ID> -n 1 -r html,cli
```

The recommended method is to paste the command into `tests/*.md` and manage sensitive parameters with environment variables (avoiding leaks and making environment switching easier).

 

## Triggering API Tests with One Word: Ready-to-Use

Enter the project directory and start Claude Code:

```bash
claude
```

Run the test with a single sentence:

> **"Run regression testing for 01_e2e_happy_path in the dev environment. Once completed, summarize the results with these 4 points: pass rate, failed test cases, estimated cause of failure, and suggested fix procedures."**

What Claude does for you:

1.  Identifies the test scenario/suite you want to run (`01_e2e_happy_path`).
2.  Checks the environment (`dev`) and loads the corresponding environment variables.
3.  Calls the script to execute the Apidog CLI.
4.  Summarizes the output in the 4 requested points and presents a structured conclusion.


![](https://raw.githubusercontent.com/takuya77088/multi-platform-publisher/main/images/260123-skill-2e.png)

## More Human-Like Output: Automated Summaries are Much Faster than Reading Logs

Traditional CLI output is machine-friendly but not human-friendly.
Claude Skills organizes the output into a summary suitable for development/test collaboration. Specifically:

*   **Pass Rate**: Grasp the overall success rate at a glance.
*   **Failed Test Cases**: Clearly see which tests failed.
*   **Estimated Cause of Failure**: Auth errors, env variable issues, assertion failures, data mismatch, etc.
*   **Suggested Fix Procedures**: Switch environments and compare, run specific modules only, add assertions, etc.


This step is the key to "efficiency." Colleagues don't need to keep asking, "What's the status? Where did it fail?"
You can just paste Claude's summary into the chat and move on to the next step.

 

## Core Benefits of This Workflow

If you really want to integrate API automated testing into daily development, the benefits of this combination are clear:

1.  **Lower Barrier**: Newcomers don't need to remember commands or look up scenario IDs; they just speak naturally.
2.  **Standardization**: Test definitions, environment variables, and execution scripts are version-controlled and accumulated in the repository.
3.  **Faster Issue Identification**: Failures aren't just "Red"; they come with explanations of causes and fix suggestions.
4.  **Easy Workflow Integration**: Naturally extends to automatic regression before commits/merges.

 

## Common Extension Directions

*   **Multi-Environment Comparison (dev vs test)**: Run the same test in different environments and automatically compare differences.
*   **Git Change-Based Test Filtering**: Run only tests related to affected modules to reduce regression time.
*   **Pre-Commit/Pre-Merge Auto-Regression**: Automatically run critical tests at the commit/PR stage to catch issues early.

 

## Summary

[Apidog](https://www.apidog.com/?utm_source=opr&utm_medium=a2devto1&utm_content=claude-skills-automation) provides specialized API automated testing capabilities, while Claude Skills provides natural language drive and execution orchestration. The value of combining the two is transforming "Test Execution" from a step requiring specialized operations into an action you can do in a snap.

If you want to increase the frequency of API automated testing and make regression a part of daily development, this **Apidog × Claude** workflow is worth trying.

Since I started using this combination, the psychological barrier to running tests has dropped significantly. "I'll do it later" changed to "I'll check it right now." I believe this is the true value of AI tools.


**If you found this article helpful, please share it. If your team has similar challenges, let us know in the comments. Let's think of solutions together!**
