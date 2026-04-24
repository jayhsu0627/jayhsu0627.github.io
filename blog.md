---
layout: blog_layout
title: Blog
permalink: /blog/
---

<h2>Blog Posts</h2>
<p>My latest thoughts, tutorials, and project updates.</p>
<br>

<table style="width:100%;border:0px;border-spacing:0px;border-collapse:separate;margin-right:auto;margin-left:auto;">
  {% assign sorted_posts = site.posts | sort: 'date' | reverse %}
  {% for post in sorted_posts %}
  {% if post.categories contains 'blog' or post.categories == 'blog' %}
  <tr>
    <td style="padding:2.5%;width:100%;vertical-align:middle">
      <a href="{{ post.url }}"><h3>{{post.title}}</h3></a>
      <br>
      <em>{{ post.date | date: "%B %d, %Y" }}</em>
      <br>
      <p></p>
      {{ post.excerpt }}
    </td>
  </tr>
  {% endif %}
  {% endfor %}
</table>
