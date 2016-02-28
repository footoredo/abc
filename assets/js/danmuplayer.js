var danmu = [], buffer = [];
var displayed = new Array();
var api, danmu_check, last_check, gun, id_count=5;
var danmuplayerJQ, danmuplayer;
var playerJQ, player;
var on_the_run = [[],[],[]];
var video_id;
var normal_width;

var sleep = function(milliseconds) {
    var start = new Date().getTime();
    for (var i=0; i<1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) break;
    }
}
 
// px/ms
var get_velocity = function(danmu) {
    return (770.0 + danmu.width()) / 6000;
}

var start_danmu = function(danmu) {
    if (danmu.hasClass("top") || danmu.hasClass("bottom")) {
        danmu.resume();
        return;
    }
    velocity = get_velocity(danmu);
   
    danmu.animate({"left":-danmu.width()}, (danmu.position().left+danmu.width()) / velocity, "linear", function() {
        danmu.remove();
    });
}

var stop_danmu = function(danmu) {
    if (danmu.hasClass("top") || danmu.hasClass("bottom")) {
        danmu.pause();
        return;
    }
    danmu.stop();
}

var get_pos = function(t,h) {
    if (t) on_the_run[t].forEach(function(a){if ($("#"+a[1].id).length==0) a[0]=-1});
    else on_the_run[t].forEach(function(a){if ($(a[1]).position().left+$(a[1]).width()<=danmuplayerJQ.width()) a[0]=-1})

    on_the_run[t].sort(function(a,b){if (a[0]<b[0]||a[0]==b[0]&&$(a[1]).position().top>$(b[1]).position().top) return 1; else return -1});
    while (on_the_run[t].length && on_the_run[t][on_the_run[t].length-1][0]==-1) on_the_run[t].pop();
    var z=0, y=0, tt;
    if (on_the_run[t][0]) z = on_the_run[t][0][0];
    for (var i=0; i<on_the_run[t].length && on_the_run[t][i][0]==z; i++)
        if (y+h > (tt=parseInt(t==2?on_the_run[t][i][1].style.bottom:on_the_run[t][i][1].style.top))) {
            y = tt + $(on_the_run[t][i][1]).height();
        }
        else break;
    if (y+h > playerJQ.height()) {
        z++;
        y = 0;
    }
    return [z,y];
}

var shoot_danmu = function(obj, newly_send) {
    if ($("#"+obj["id"]).length>0) return;
    var content = obj["context"];
    var bullet = document.createElement("div");
    bullet.setAttribute("class", "bullet" + [""," top", " bottom"][obj["danmu_type"]] + (newly_send?" new":""));
    bullet.id = obj["id"];
    bullet.innerHTML = content;
    bullet.style.color = obj["danmu_color"];
    var t = obj["danmu_type"];
    bullet.style.visibility = "hidden";
    danmuplayer.appendChild(bullet);
    var pos = get_pos(t, $(bullet).height());
    if (t<2) bullet.style.top = pos[1] + "px";
    else {
        bullet.style.top = "auto";
        bullet.style.bottom = pos[1] + "px";
    }
    if (t) bullet.style.left = (danmuplayerJQ.width() - $(bullet).width())/2.0 + "px";
    else bullet.style.left = danmuplayerJQ.width() + "px";
    bullet.style.visibility = "visible";
    on_the_run[t].push([pos[0],bullet]);
    if (t==1) 
        $(bullet).animate({"top":pos[1]}, 3000, function() {
            $(bullet).remove();
        });
    else if (t==2) {
        $(bullet).animate({"bottom":pos[1]}, 3000, function() {
            $(bullet).remove();
        });
    }
    else start_danmu($(bullet));

    if (api.paused) stop_danmu($(bullet));
}

var buffer_timeout = function(i) {
    return setTimeout(function(){
       if (api.paused) return;
       shoot_danmu(danmu[i]);
       if (i+100 < danmu.length)
            buffer.push(buffer_timeout(i+100));
        buffer.shift();
    }, 1000*(danmu[i]["send_time"]-api.video.time));
}

var buffer_danmu = function() {
    if ($(".danmuplayer").hasClass("hide")) return;
    var time = api.video.time, start=-1;
    for (var i=0; i<danmu.length; i++) {
        if (danmu[i]["send_time"]-0.000001 > time) {
            start = i; break;
        }
    }

    if (start<0) return;
    for (var i=start; i<danmu.length && i-start<100; i++) {
        if (buffer.find(function(x){x==danmu[i]})) continue;
        var timeout = buffer_timeout(i);
        buffer.push(timeout);
    }
}

var clear_buffer = function() {
    while (buffer.length) {
        clearTimeout(buffer[0]);
        buffer.shift();
    }
}

var init_player = function() {
    danmuplayer = document.createElement("div");
    danmuplayer.setAttribute("class", "danmuplayer");
    danmuplayer.style.width = danmuplayer.style.height = "100%";
    playerJQ = $(".fp-player");
    player = document.getElementsByClassName("fp-player")[0];
    player.appendChild(danmuplayer)
    danmuplayerJQ = $(".danmuplayer");
}

var sync_player = function() {
    danmuplayer.style.width = playerJQ.width() + "px";
    danmuplayer.style.height = playerJQ.height() + "px";
    danmuplayer.style.top = playerJQ.position().top + "px";
    danmuplayer.style.left = playerJQ.position().left + "px";
}

$(document).ready(function() {
    api = flowplayer();
    if (!api) return;

    video_id = $(".flowplayer").attr("id");
    $.get("https://danmu.quack.press/get/video/" + video_id, function(data, status) {
        danmu = JSON.parse(data);
        danmu = danmu.sort(function(a,b){return a["send_time"]-b["send_time"]});
        console.log("Danmu loaded.");
        if (api.playing) buffer_danmu();
    });

    api.on("load", function() {
        init_player();
        normal_width = $(".flowplayer").width();
    });

    api.on("ready", function() {
        buffer_danmu();
    });

    api.on("pause", function() {
        clear_buffer();
        $(".bullet").each(function(){stop_danmu($(this))});
    });

    api.on("resume", function() {
        $(".bullet").each(function(){start_danmu($(this))});
        buffer_danmu();
    });

    api.on("beforeseek", function() {
        if (api.playing) {
            clear_buffer();
            $(".bullet").remove();
        }
        else {
            $(".bullet").remove();
        }
    });

    api.on("seek", function() {
        if (api.playing) buffer_danmu();
    });

    api.on("fullscreen", function() {
        $(".bullet").each(function(){stop_danmu($(this))});
        if (api.playing) $(".bullet").each(function(){start_danmu($(this))});
    });

    api.on("fullscreen-exit", function() {
        $(".bullet").each(function(){stop_danmu($(this))});
        if (api.playing) $(".bullet").each(function(){start_danmu($(this))});
    });
});

var fire_danmu = function() {
    var gun = document.getElementsByClassName("danmu-bore")[0];
    var bullet = {};
    bullet["send_time"] = api.video.time;
    bullet["context"] = gun.value;
    bullet["danmu_type"] = $(".danmu-positioner-select").prop("selectedIndex");
    bullet["danmu_color"] = $(".danmu-colorpicker-input").val();
    bullet["danmu_size"] = 1.0;

    bullet["video_id"] = video_id;
    bullet["user_id"] = "";

    if (gun.value.length > 50) {
        alert("太长了傻逼");
        return false;
    }
    if (gun.value.length == 0) {
        alert("你没输傻逼");
        return false;
    }

    gun.value = "";
    $.post("https://danmu.quack.press/send", bullet, function(data, status) {
            bullet["id"] = data;
            shoot_danmu(bullet, true);
            setTimeout(function(){danmu.push(bullet);}, 500);
            });
    return false;
}

var hide_danmu = function() {
    $(".danmuplayer").addClass("hide");
    clear_buffer();
    $(".bullet").remove();
}

var show_danmu = function() {
    $(".danmuplayer").removeClass("hide");
    if (api.playing) buffer_danmu();
}
;flowplayer(function (api, root) {
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
