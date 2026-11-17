---
layout: blog_layout
title: "My AI Research Partner and I Kept Losing. Then I Read the Winner's Notebook."
date: 2026-11-16 00:00:00 +00:00
permalink: /blog/arc-whitebox-agents/
categories: blog
author: "jayhsu"
authors: "<strong>jayhsu</strong>"
venue: "Personal Blog"
highlight: true
published: true
---

*Epistemic status: the first half is a field report built from my logs and the winner's write-up; the second half is a hypothesis I can't yet prove. Opinions are my own. I drafted and revised this post with help from Claude, the same model that appears in it.*

For the past two months I have done science with an AI. Many evenings I sat with Claude Code, running Anthropic's Opus 5.5 model, and pointed it at an open problem. Lately a pattern had started to bother me. On open-ended research it is dazzling in the first hour and strangely stubborn by the fiftieth. It writes the code, runs the experiments and explains the results better than I could. Then, at some point, it calmly concludes that a wall exists, and we stop walking.

The contest ended last week. (I never competed very aggressively; I worked on it in spare hours, during overnight layovers and on planes.) The winner has since published a detailed account of how he did it. Reading it next to my own logs was humbling, and clarifying. The short version: the problem was solvable all along. The winner had no single secret, though he did have two genuinely new ingredients. Most of the gap was cost: in arithmetic, in training, and in agent-hours.

## The puzzle

The contest was the [ARC White-Box Estimation Challenge](https://www.aicrowd.com/challenges/arc-white-box-estimation-challenge-2026/). You are handed a neural network built at random: 16 layers of about a thousand artificial neurons each. You must predict its average output when random noise is fed in, but you may not simply run it millions of times and take the average. You have to *reason* your way to the answer from the wiring.

The score is your error multiplied by your compute bill, the arithmetic you spent. Cutting the bill in half counts exactly as much as cutting the error in half, at least until you reach a floor of 10 percent of the budget.

Everyone serious converged on the same broad strategy. Instead of simulating the network, you carry a few summary numbers through it, layer by layer, the way a weather forecaster tracks averages and spreads rather than individual air molecules. For each neuron you track its typical value, how much it wobbles, how lopsided the wobble is, and how often it swings to extremes. The difficult part is bookkeeping. Lopsidedness created early lingers for many layers, and keeping track of it is expensive.

My best entry finished about four times behind the winner. A second, more ambitious one was actually slightly more accurate, but it scored thirteen times worse because it spent eight times as much arithmetic.

## Same family, different bill

The first surprise in the winner's write-up ([Marius Binner's paper](https://marbinner.github.io/arc-whitebox-challenge-2026-submission-marius-binner/paper/Binner-ARC-WBE-Phase2-writeup.pdf)) was how familiar it looked. His method belongs to the same family as mine and tracks the same summary numbers. He does claim two ingredients beyond the reference method, and one of them, a fold that turns a higher-order effect into the quantity that drives the next layer, appears in no other write-up. But most of the gap was the bill: about 2× in error, and 2× to 8× in cost.

Most of his savings were things my agent and I knew about and kept postponing. (I was in the middle of an internship and flying across the country for two conferences. I know it sounds like an excuse.)

He lists about seven cost levers. Among them:
- doing four multiplications per step where we did nine;
- using cleverer recipes for multiplying large tables of numbers;
- skipping the expensive math for neurons where nothing interesting happens, the ones that are always on or always off;
- compressing old memories into one small shared set of directions (more on that below).

No single change was dramatic; most saved between 10 and 40 percent. Stacked, they cut his bill sixfold. Over two months his score improved 21-fold: about 6.5× from cost and 3.3× from error. Fixing the bill first also makes every later experiment cheaper.

Here is the moment that stings. In the contest's final week, a few hours into a long session, my agent produced careful measurements and a clear verdict: the cost floor held, and the leaders "cannot be" doing a certain expensive kind of bookkeeping within their budget. The winner was doing exactly that, cheaply, by combining several of the levers above. The leaderboard had been telling us so all along. When someone beats your cost floor, the right conclusion is that your cost model contains a wrong assumption.

That, I think, is the failure mode I had been sensing. The agent reasons beautifully *inside its frame*, but it draws the edges of its verdicts too wide. "Impossible for our design" became "impossible for anyone."

## Editors that read their neighbours

The second difference was learning. We both added small learned correctors on top of the hand-derived math. Think of them as editors who fix the summary numbers as they pass from layer to layer. (The idea for mine came from me, borrowed from well outside the field; more on that below.)

Mine looked at one neuron at a time. It was trained on 16 example networks, for about an hour and a quarter of GPU time. It improved accuracy by 8 to 10 percent and then stalled. My agent measured the stall carefully and declared the direction closed.

The measurement was right. Another participant, [Artyom_Mazur](https://discourse.aicrowd.com/t/18249), had argued that an editor reading only one neuron's own state can recover just a few percent of the error, and the winner cites him. The mistake was the scope. The evidence covered editors that read one neuron at a time; my agent closed the door on learned editors altogether.

The winner's editors changed the network's joint state before the next layer mixed it, and they took each neuron's relationships to the others as inputs. They were trained together with 138 hand-derived constants, through an exact replica of his estimator built from the same source code, on more than 15,000 example networks. Most of those were free public data I never used. By my rough count, that is about 4,000 times more training than mine. He is careful here, though: more data alone did not improve his editors, and he lists the reasons they worked as untested.

Hardware was not the gap. By my estimate, a single workstation graphics card like mine could have reproduced his final training run in a day or two, though that run was warm-started from earlier ones. I simply did not spend the compute I had. We even ran in a slow, extra-precise number format that wasted most of the card's speed.

## What agents actually buy

Then there is the team. The winner was one person directing a small fleet of AI agents from three model families:
- a Claude Code "driver" that planned and merged the work;
- other sessions whose only job was to audit the driver's claims against the raw records;
- up to fifteen OpenAI Codex agents, each working a separate research lane in its own copy of the code;
- Google's Gemini for reviews and independent analyses.

In eight weeks they logged more than 500 experiments and 255 graded submissions. Each lane started from a written brief with a motivation, a numeric target and a time box. I ran one agent at a time, with me in the loop: Claude Code in its most basic setup.

My guess at his AI bill is a few thousand dollars, perhaps ten thousand. Mine was a $20-a-month subscription.

What does that money buy? Mostly not intelligence. I suspect each of his agents was about as clever as mine. **What agents buy is wall-clock time.** A second agent roughly doubles your research hours; fifteen of them over eight weeks is something like two years of solo evenings. Parallel lanes also guard against the habit I kept seeing in mine, which is to dig one hole very deep while promising directions sit untouched next to it.

The other thing the money buys is a skeptic. The winner's agents checked one another. Decisions were written down before results were read. Fresh test sets were held back and opened only once, and no result counted as confirmed on fewer than 32 held-out networks. My agent graded its own homework, and sometimes declared a dead end after testing on four or six. In open-ended science, the most valuable agent may be the one whose only job is to say "show me."

## Who owned which failure

Four different things went wrong, and they deserve different owners.

- **Negative results on too little evidence, and too wide a scope.** My agent closed promising directions after testing on four to six networks, and on narrower variants than the verdict claimed. I accepted those verdicts. *Lesson:* a dead end is provisional until it survives a larger test, and it covers only what was tested.
- **A cost estimate treated as a law.** The leaderboard had already broken our "floor." *Lesson:* treat every "impossible" as a tripwire. List the assumptions behind it, and try to break each one.
- **Never stepping outside the frame.** The agent did not reach for other framings unless prompted. *Lesson:* force a reframe at regular intervals, or give parallel agents different starting frames.
- **Not spending what we had.** Compute sat unused, free data went unread, we ran in a slow number format, and we postponed efficiency in a contest where efficiency was half the score. These were mostly mine, and my second entry was the purest case: we polished accuracy in a contest that scored accuracy times cost. *Lesson:* when the score multiplies cost and error, fix the bill first.

Only the third is about frames, and as I'll argue next, even my frame stories turn out to be about the first.

## A hypothesis: frames opened, doors closed too wide

Most of the gap, then, was resources and hygiene. But a pattern keeps pulling me back. Twice, a useful shift came from me stepping up a level. Not every nudge of mine helped; some of my hints led us astray, which is why I started adding "don't follow my hints."

The first time, I borrowed from fields far from this one: image generation (ControlNet) and language-model fine-tuning (LoRA). Their trick is a small learner that starts at zero and is trained through a frozen system, and it became my learned editors. The winner's editors share the start-near-zero idea but not the freezing: he trained them together with the hand-derived math, and the two co-adapted. Learning inside the calculation was the right frame. My frozen version may have been the wrong variant of it.

The second time, in the contest's final week, I typed one sentence: treat this partly as a problem about the efficiency of multiplying large tables of numbers, and don't follow my hints into a local minimum. Within the hour the agent had overturned one of my second entry's "walls." The old memories inside the network, which we had assumed could not be compressed, collapse onto a small shared set of directions. That fact comes from the mathematics of multiplying random matrices. My first entry, built on public code, already used a version of it, and so did the winner. The knowledge was in the model, and even in my own codebase.

Both times the agent ran well inside the new frame, then closed the door too wide. It measured the editors' plateau and closed learned editors altogether, when its evidence covered only the one-neuron kind. A few hours after the matrix reframe, in the same session, it turned a cost estimate built from our own design into a verdict about everyone: the "cannot be" above. Its measurements were right. The scope of its conclusions was not.

The winner's setup looks built to prevent exactly that. He writes that most of his specific ideas, including both new ingredients and his editors' designs, came from his agents, not from him. His part was structure: separate lanes with targets and time boxes, auditors, the 32-network rule, and the choice of which kinds of learning methods to try. He doesn't say how often he stepped in, or how. I would love to know. It may be the most important number in his setup.

A Meta engineer, Oleksandr Savsunenko, [wrote recently](https://lnkd.in/ekjv96cF) that frontier models now know more than he does. They chain together theorems he has never heard of, and he can no longer follow the details. His conclusion: "Intellectual parity is required for productive and engaging work with AI." With agents at scale it gets harder still, because no one reads every line that fifteen agents write. I replied under his post that our tools have not caught up. An editor like VS Code shows me code line by line, when what I need is the full picture: which doors are open, which were closed, and on how much evidence. For now I improvise; a good share of my prompts end in "TL;DR" or "ELI5."

So I read the gap differently. The models beat us on breadth of facts. Where we may still help, at least sometimes, is in choosing frames and policing the scope of verdicts, which is the level at which we now have to supervise them anyway.

When I think about a hard problem, I don't move token by token. I move in big jumps between descriptions of the problem. Is this really about accuracy, or about cost? Is it physics, linear algebra, or learning? It feels like reading several lines at once. My agent did the reverse: it searched facts widely and frames narrowly.

Before crediting humans with a special faculty, two caveats. First, people do this too. In a classic experiment, [Gick and Holyoak (1980)](https://deepblue.lib.umich.edu/handle/2027.42/23210) gave subjects a story that contained the solution to a puzzle. Only about 30 percent used it on their own; once told the story was relevant, most solved the puzzle. Knowing something and reaching for it are different skills, in brains as in models.

Second, my advantage may have been my position rather than my mind. I sat outside the agent's context, looking at a leaderboard. Its context, meanwhile, filled with its own earlier conclusions, and it treated them more and more as settled fact. That alone would explain "dazzling in the first hour, stubborn by the fiftieth," with no deep limit involved. It is also testable: restart from the moment of a verdict, give a fresh agent only the problem and the raw data, and see whether it rebuilds the same wall.

This matters for the bigger debate. In ["LLMs can't jump"](https://proceedings.mlr.press/v306/zahavy26a.html), Tom Zahavy of Google DeepMind argues that language models are strong at induction and increasingly at deduction, but lack the leap that produces new foundational ideas. My story cuts against the strong form of that claim, because one sentence produced the jump within an hour. The winner's story cuts against it harder: his agents proposed his two new ingredients. Still, I suspect the leaps Zahavy means are often jumps into a different space, where a hard problem suddenly looks easy. Feynman's diagrams turned pages of algebra into pictures. Einstein said he thought in "more or less clear images" rather than in words.

These are anecdotes, not proof. Every winning move in my contest was a jump into a space the model already knew. What my agent lacked was a default of jumping unprompted, and of keeping doors open long enough. Both can be engineered: parallel lanes with different starting frames, a forced reframe when progress stalls, and an auditor who asks what each "dead end" actually tested.

[My own recent paper](https://shengjie-xu.com/conferences/2026_COLM_analogy-vector/) (COLM 2026) offers a suggestive parallel. A direction for analogy-making exists in every base model we tested, but it barely changes behavior until training wires it in. Suggestive is all it is. The experiment that would earn the link is to steer that direction during a real research task.

One more caution. I know which frame was right only because someone won. One winner's notebook shows what worked, not what was decisive.

So here is where I've landed, and where I'd like to be argued with.

## Questions for you

- Is "frame search" a skill separate from knowing things, or just knowledge retrieval steered by context?
- At the same token budget, would three agents with deliberately different starting frames match fifteen similar ones? The winner used three model families, which may already have supplied different frames.
- Is "knows it but doesn't reach for it" a failure of models, or what happens to any solver deep inside a task?
- How would you tell an agent stuck in the wrong frame from one that is simply stuck, or one whose "dead end" covered less than it claimed?
- Learning inside the calculation failed for several teams and worked for one, and even the winner lists the reasons as untested. Was it where the correction acts, the end-to-end training, or the data?
- For us humans, is the lasting advantage thinking abstractly, or deciding what is worth spending on?
