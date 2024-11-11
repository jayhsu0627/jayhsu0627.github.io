# updated website

This repo is built on a fork of **Jekyll Now** from [this repository](https://github.com/barryclark/jekyll-now). **Jekyll** is a static site generator that's perfect for GitHub hosted blogs ([Jekyll Repository](https://github.com/jekyll/jekyll))

The website design is just a modification of [Jon Barron's website](https://jonbarron.info/) and is converted for my own use, re-purposing my old markdown posts. **Feel free to use template for your own purposes**, but please respect copyright for all the images/content in my `images`, `pdfs`, `_posts` folders. 

### Jekyll Setup Guide (macOS, Windows, Linux)

1. **Install Ruby (macOS)**:
   - Use Homebrew for version management: `brew install ruby@3.2`
   - Add Ruby 3.2 to your PATH:
     ```bash
      echo 'export PATH="/opt/homebrew/opt/ruby@3.2/bin:$PATH"' >> ~/.zshrc
      source ~/.zshrc
     ```

2. **Set Up Gemfile**:
   - In the project directory, create or update `Gemfile`:
     ```bash
      source "https://rubygems.org"
      gem "jekyll", "~> 4.2.0"
      gem "webrick", "~> 1.7"  # Needed for Jekyll server
      gem "csv"                 # Add csv gem
      gem "base64"              # Add base64 gem
      gem "bigdecimal"          # Add bigdecimal gem
      gem "jekyll-sitemap"
     ```

3. **Install Bundler and Dependencies**:
   - Run:
     ```bash
      gem install bundler
      bundle install
     ```

4. **Serve the Site**:
   - Start Jekyll with:
     ```bash
      bundle exec jekyll serve --port 4001
     ```


## issues
* TODO, add mouse hoveron. 
* In general, jekyll will try to build a full page for every post. I skip that by forcing `permalink: /`. This creates multiple entries in sitemap.xml for index.html but is otherwise fine. 
* If you want multiple paragraphs, consider using `excerpt_separator: <!--more-->` in `_config.yml`, for my own use I didn't need this. 
* My own posts have lots of extra stuff left over from my old jekyll design ("author", long descriptions, etc.), feel free to ignore them
* I use thumbnails, so I can upload arbitrary sized images but then only display small ones. The `_make_thumbnails.sh` script generates them and the html template looks in `tn/` for all images. 
* I have three categories of post with slightly differerent formatting, so changing sizing requires edits in multiple paces. 
* Template borrowed from [leonidk.github.io](leonidk.github.io).
