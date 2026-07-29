# updated website

This repo is built on a fork of **Jekyll Now** from [this repository](https://github.com/barryclark/jekyll-now). **Jekyll** is a static site generator that's perfect for GitHub hosted blogs ([Jekyll Repository](https://github.com/jekyll/jekyll))

The website design is just a modification of [Jon Barron's website](https://jonbarron.info/) and is converted for my own use, re-purposing my old markdown posts. **Feel free to use template for your own purposes**, but please respect copyright for all the images/content in my `images`, `pdfs`, `_posts` folders. 

### Jekyll Setup Guide (macOS, Windows, Linux)

1. **Install Ruby and Dependencies**:
   - **macOS**:
     - Use Homebrew for version management: `brew install ruby@3.2`
     - Add Ruby 3.2 to your PATH:
       ```bash
       echo 'export PATH="/opt/homebrew/opt/ruby@3.2/bin:$PATH"' >> ~/.zshrc
       source ~/.zshrc
       ```
   - **Ubuntu / Linux**:
     - Install Ruby headers, build tools, and ImageMagick (for thumbnails):
       ```bash
       sudo apt update
       sudo apt install -y ruby-dev build-essential zlib1g-dev imagemagick
       ```

2. **Install Bundler and Dependencies**:
   - The repo already includes a `Gemfile`. From the project directory:
     ```bash
     gem install bundler
     bundle config set --local path 'vendor/bundle'
     bundle install
     ```

3. **Serve the Site**:
   - Start Jekyll with:
     ```bash
     bundle exec jekyll serve --port 4001
     ```
   - Open http://127.0.0.1:4001

4. **Push and URL**:
    In Settings > Pages, under Custom domain, enter `yourdomain.com` if it’s not already there. This ensures your site is accessible at your custom domain.




## issues
* TODO, add mouse hoveron. 
* In general, jekyll will try to build a full page for every post. I skip that by forcing `permalink: /`. This creates multiple entries in sitemap.xml for index.html but is otherwise fine. 
* If you want multiple paragraphs, consider using `excerpt_separator: <!--more-->` in `_config.yml`, for my own use I didn't need this. 
* My own posts have lots of extra stuff left over from my old jekyll design ("author", long descriptions, etc.), feel free to ignore them
* I use thumbnails, so I can upload arbitrary sized images but then only display small ones. The `_make_thumbnails.sh` script generates them and the html template looks in `tn/` for all images. 
* I have three categories of post with slightly differerent formatting, so changing sizing requires edits in multiple paces. 
* Template borrowed from [leonidk.github.io](leonidk.github.io).
