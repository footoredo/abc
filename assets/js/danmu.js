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

var shoot_danmu = function(obj) {
    //console.log(danmu.findIndex(function(x){return x==obj}));
    if ($("#"+obj["id"]).length>0) return;
    var content = obj["context"];
    var bullet = document.createElement("div");
    bullet.setAttribute("class", "bullet");
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
    var JQ = $(bullet);
    on_the_run[t].push([pos[0],bullet]);
    if (t==1) 
        JQ.animate({"top":pos[1]}, 3000, function() {
            JQ.remove();
        });
    else if (t==2)
        JQ.animate({"bottom":pos[1]}, 3000, function() {
            JQ.remove();
        });
    else 
        JQ.animate({"left":-JQ.width()}, $(".danmuplayer").width()*1.0/normal_width*5000, "linear", function() {
            JQ.remove();
        });
    if (api.paused) JQ.pause();
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
    var time = api.video.time, start=-1;
    for (var i=0; i<danmu.length; i++) {
        if (danmu[i]["send_time"]-0.000001 > time) {
            start = i; break;
        }
    }

    console.log("start:",start);
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

window.onload = function() {
    api = flowplayer();
    video_id = document.getElementsByClassName("flowplayer")[0].id;
    init_player();
    normal_width = $(".flowplayer").width();

    $.get("https://danmu.quack.press/get/video/" + video_id, function(data, status) {
        danmu = JSON.parse(data);
        danmu = danmu.sort(function(a,b){return a["send_time"]-b["send_time"]});
        console.log("Danmu loaded.");
        if (api.playing) buffer_danmu();
    });

    api.on("ready", function() {
        buffer_danmu();
    });

    api.on("pause", function() {
        clear_buffer();
        $(".bullet").pause();
    });

    api.on("resume", function() {
        $(".bullet").resume();
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

    /*api.on("fullscreen", function() {
            $(window).unbind("resize");
            danmuplayer.style.width = "100%";
            danmuplayer.style.height = "100%";
            danmuplayer.style.top = "0";
            danmuplayer.style.left = "0";
            });

    api.on("fullscreen-exit", function() {
            sync_player();
            $(window).resize(function(){sync_player()});
            });*/
};


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
            console.log(data);
            console.log(status);
            bullet["id"] = data;
            shoot_danmu(bullet);
            setTimeout(function(){danmu.push(bullet);}, 500);
            });
    return false;
}

