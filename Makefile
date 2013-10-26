css: less/main.less
	lessc less/main.less > css/main.css

watch:
	watch-lessc -i less/main.less -o css/main.css
