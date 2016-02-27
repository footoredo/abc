flowplayer(function (api, root) {
	api.on("load", function () {
        $(".fp-controls").append($(".fp-fullscreen"));

		var controls = document.createElement("div");
		controls.setAttribute("class", "danmu-controls");
        $(".fp-ui").append(controls);

        var styleboard = document.createElement("div");
        styleboard.setAttribute("class", "danmu-styleboard");
        controls.appendChild(styleboard);

        var colorpicker = document.createElement("span");
        colorpicker.setAttribute("class", "danmu-colorpicker");
        colorpicker.innerHTML = "\uf249";
        styleboard.appendChild(colorpicker);

        var colorpicker_input = document.createElement("input");
        colorpicker_input.setAttribute("class", "danmu-colorpicker-input");
        colorpicker_input.type = "text";
        colorpicker_input.value = "#fff";
        $(colorpicker_input).keyup(function() {
            console.log($(this).val());
            $(colorpicker).css("color", $(this).val());
        });
        styleboard.appendChild(colorpicker_input);
        
        $(colorpicker_input).hide();
        $(colorpicker).click(function() {
            if ($(colorpicker_input).is(":visible")) {
                $(colorpicker_input).hide();    
            }
            else {
                $(colorpicker_input).show();
            }
        });

        var positioner = document.createElement("span");
        positioner.setAttribute("class", "danmu-positioner");
        positioner.innerHTML = "\uf26c";
        styleboard.appendChild(positioner);

        var positioner_select = document.createElement("select");
        positioner_select.setAttribute("class", "danmu-positioner-select");
        var option1 = document.createElement("option");
        option1.text = "滚动弹幕";
        option1.selected = "selected";
        positioner_select.add(option1);
        var option2 = document.createElement("option");
        option2.text = "顶端弹幕";
        positioner_select.add(option2);
        var option3 = document.createElement("option");
        option3.text = "底端弹幕";
        positioner_select.add(option3);
        styleboard.appendChild(positioner_select);

        $(positioner_select).hide();
        $(positioner).click(function() {
            if ($(positioner_select).is(":visible")) {
                $(positioner_select).hide();    
            }
            else {
                $(positioner_select).show();
            }
        });

		var gun = document.createElement("form");
		gun.setAttribute("class", "danmu-gun");
		gun.setAttribute("onsubmit", "return fire_danmu()");
		controls.appendChild(gun);

        var toggle = document.createElement("a");
        toggle.setAttribute("class", "danmu-toggle");
        toggle.innerHTML = "\uf205";
        toggle.onclick = function() {
            if (toggle.innerHTML == "\uf205") {
                toggle.innerHTML = "\uf204";
                hide_danmu();
            }
            else {
                toggle.innerHTML = "\uf205";
                show_danmu();
            }
        }
        document.getElementsByClassName("fp-controls")[0].appendChild(toggle);

        var styler = document.createElement("input");
        styler.setAttribute("class", "danmu-styler");
        styler.type = "button";
        styler.value = "\uf013";
        gun.appendChild(styler);

        $(styleboard).hide();
        $(styler).click(function() {
            if ($(styleboard).is(":visible")) {
                $(styleboard).hide();    
            }
            else {
                $(styleboard).show();
            }
        });

        var borecontainer = document.createElement("div");
        borecontainer.setAttribute("class", "danmu-borecontainer");
        gun.appendChild(borecontainer);

		var bore = document.createElement("input");
		bore.type = "text";
		bore.setAttribute("class", "danmu-bore");
        bore.placeholder = "最多50个字～"
		borecontainer.appendChild(bore);

		var trigger = document.createElement("input");
		trigger.type = "submit";
		trigger.setAttribute("class", "danmu-trigger");
        trigger.value = "\uf135";
		gun.appendChild(trigger);

        var timer = 0, hiding = false, lastX = -1, lastY = -1;
        api.on("fullscreen", function() {
            lastX = lastY = -1;
            $(window).on("mousemove", function(event) {
                if (event.clientX == lastX && event.clientY == lastY) 
                    return;
                lastX = event.clientX; lastY = event.clientY;
                if (hiding) {
                    $(".fp-controls,.fp-time").show();
                    $(".fp-ui").css("cursor", "auto");
                }
                hiding = false;
                if (timer) {
                    clearTimeout(timer);
                    timer = 0;
                }
                timer = setTimeout(function() {
                    console.log("triggered");
                    if (!hiding) {
                        $(".fp-controls,.fp-time").hide();
                        $(".fp-ui").css("cursor", "none");
                    }
                    hiding = true;
                }, 2000);
            });
            $(window).trigger("mousemove");
        });
        api.on("fullscreen-exit", function() {
            if (hiding) {
                $(".fp-controls,.fp-time").show();
                $(".fp-ui").css("cursor", "auto");
            }
            if (timer) {
                clearTimeout(timer);
                timer = 0;
            }
            $(window).off("mousemove");
        });
	});
});
