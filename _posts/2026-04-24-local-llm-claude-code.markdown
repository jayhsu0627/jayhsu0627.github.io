---
layout: blog_layout
title: "Running Claude Code Locally: Replacing Sonnet with Local LLMs"
date: 2026-04-24 00:00:00 +00:00
permalink: /blog/claude-locally/
image: /images/local_llm_claude.png
categories: blog
author: "jayhsu"
authors: "<strong>jayhsu</strong>"
venue: "Personal Blog"
highlight: true
published: true
---

![Banner Overview](/images/Gemini_Generated_Image_fbbgrifbbgrifbbg.png)

I got tired of constantly renewing my Claude usage limits. I need to save my allowance money.

So, for the past week, I've been trying to completely replace the Claude 3.5 Sonnet backend of the official `claude-code` CLI with local open-source LLMs. I run an RTX Pro 6000 Blackwell (96GB), which gives me enough room to test larger models.

Here is what worked, what didn't, and the current optimal setup.

**TL;DR:** After testing the newest Qwen and Gemma variants, **Gemma-4-31B-it** is currently the absolute best local model for powering `claude-code` due to its one-shot autonomous task completion.

---

### Part 1: The vLLM Setup & Protocol Wall

Pointing `ANTHROPIC_BASE_URL` to your local vLLM instance is easy, but getting the open-source models to actually run bash commands is hard. At first, the models just printed out JSON tool-calls as text instead of actually executing them.

The issue is a strict schema mismatch between Anthropic's `tool_use` format and what vLLM parses for local models. To fix this, you must upgrade to `vLLM 0.19.1+` and pass exact parser flags for each architecture so the translations click with the Claude Code CLI:

*   **For Qwen2.5:** Adding `--tool-call-parser hermes` bypassed the default adapters and translated its JSON wrappers perfectly.
*   **For Qwen3:** Passing `--tool-call-parser qwen3_xml` natively handles its newer XML-based tool routing.
*   **For Gemma-4:** You must use `--tool-call-parser gemma4`, enable the V2 engine (`VLLM_USE_V2_MODEL_RUNNER=1`), and additionally pass its standard template via `--chat-template "tool_chat_template_gemma4.jinja"`.

### Mismatch 2: CUDA Asserts on Long Context

Next, I asked it to write a Material Point Method (MPM) simulation in Taichi using a local `bunny.obj` 3D model. This required the model to read large local files. **Even though the service would start up fine, attempting to use Qwen2.5-72B for this actual project test always broke the vLLM service.** It crashed:

> `vllm.v1.engine.exceptions.EngineDeadError` \
> `CUDA error: device-side assert triggered`

Claude Code injects a massive system prompt automatically. Combined with a 130k+ context window and chunked prefill, the Qwen backend threw memory access violations under real workloads.

I stabilized the setup by:
1. Banning the V1 engine: `export VLLM_USE_V1=0`
2. Swapping the backend: `--attention-backend flash_attn`
3. Capping `MAX_MODEL_LEN` to 65k to leave enough VRAM for the actual physics simulations to run concurrently.

---

### Model Testing: Qwen2.5 vs. Qwen3 vs. Gemma-4

With the infrastructure stable, I tested three models to see which could handle autonomous agentic coding best.

**1. Qwen2.5-72B-Instruct-AWQ**
*   **Setup:** Native `--tool-call-parser hermes`, scaled back context to avoid OOM.
*   **Result:** The model had great fundamental reasoning and generated excellent isolated code. However, it repeatedly crashed the vLLM server under the intense context loads of my actual project tests.

**2. Qwen3-Coder-30B-A3B-Instruct**
*   **Setup:** Native `--tool-call-parser qwen3_xml` and a massive 262k context window (enabled by A3B quantization).
*   **Result:** Extremely fast and stable on the server side (no crashes!), but it often got stuck in iterative logic loops when trying to implement the dense math required for the physics simulation.

**3. Gemma-4-31B-it**
*   **Setup:** vLLM V2 Model Runner (`VLLM_USE_V2_MODEL_RUNNER=1`), `--tool-call-parser gemma4`, and a custom `tool_chat_template_gemma4.jinja` template (provided by vLLM github).

**The Test Prompt:**
> `"Please write a material point method Taichi based python code by using the bunny.obj 3d model."`

#### The Winner: Gemma-4

Unlike Qwen2.5, **Gemma-4-31B-it was incredibly stable and fast**. It never crashed the server during my project usage. With a significantly higher one-shot success rate, it autonomously:
1. Used `Bash` to check pip configs.
2. Used `View` to read the offset logic from the `bunny.obj` file.
3. Used `Edit` to write the standard MPM `p2g`/`g2p` loops cleanly.

With `--enable-prefix-caching` enabled on the server, the iterative feedback loop between the CLI and the local model was nearly instantaneous, making it the most reliable choice for real work.

### Summary / Final Stack

You can run `claude-code` effectively locally without paying API limits.

**Working Configuration:**
* **vLLM:** `0.19.1+`
* **Model:** `Gemma-4-31B-it` (Best agentic routing)
* **Stable Arguments:** Ensure your `--tool-call-parser` precisely matches the model, use `export VLLM_USE_V1=0` if you hit CUDA asserts on long context, and use `--enable-prefix-caching` for speed.
