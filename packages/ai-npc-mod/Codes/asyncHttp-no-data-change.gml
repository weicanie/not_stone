// 确保全局变量存在，避免报错
if (variable_global_exists("my_request_id"))
{

    // try {
    var _id = ds_map_find_value(async_load, "id");
    
    // 检查是否是我们发起的请求
    if (_id == global.my_request_id)
    {
        var _status = ds_map_find_value(async_load, "status");
        // status == 0 表示请求完成
        if (_status == 0)
        {
            var _result = ds_map_find_value(async_load, "result");
            // scr_actionsLogUpdate("抵达的数据"+string(_result))
            var _http_status = ds_map_find_value(async_load, "http_status");
            if ((_http_status >= 200 && _http_status <= 300) || _http_status == 304)
            {
                //要在对话框中显示为npc消息的文本
                var _content_npc = ""
                // Parse the JSON string from result
                var _response_map = json_decode(_result);
                if (_response_map != -1) {
                    if (ds_map_exists(_response_map, "data")) {
                        var _data = ds_map_find_value(_response_map, "data");
                        // 增强空值和类型检查：确保 _data 既不是 undefined/null，也是一个有效的 ds_map ID (数字类型)
                        if (is_undefined(_data) || !is_real(_data) || !ds_exists(_data, ds_type_map)) {
                            scr_actionsLogUpdate("Error: 'data' field is null, undefined, or not a map");
                            ds_map_destroy(_response_map);

                            _content_npc = "(暂时无法进行对话，请查看游戏日志)";

                            // 将文本显示到对话框
                            var _obj_ind = asset_get_index("o_dialogue");
                            var _dialogue_inst = instance_find(_obj_ind, 0);
                            // 更换对话框中的npc消息
                            if(instance_exists(_dialogue_inst)) {
                                with(_dialogue_inst) {
                                    // 如果传入的字符串不是 dialog key，scr_dialogue_set_text 会将其作为原始内容显示
                                    scr_dialogue_set_text(_content_npc);
                                    
                                    // 强制刷新渲染器 (o_dialogRender)
                                    var _render_ind = asset_get_index("o_dialogRender");
                                    if (instance_exists(_render_ind)) {
                                        with(instance_find(_render_ind, 0)) {
                                            // 确保渲染状态同步
                                            if (variable_instance_exists(other, "is_activate")) {
                                                surfaceDraw = other.is_activate;
                                            }
                                            event_user(0); 
                                        }
                                    }
                                }
                            }

                            return;
                        }
                            
                        if (ds_map_exists(_data, "msg")) {
                            var _speaker = ds_map_find_value(_data, "speaker")
                            if(_speaker == "") {
                                _speaker = "?"
                            }
                            var _msg = ds_map_find_value(_data, "msg");
                            scr_actionsLogUpdate(_speaker+": " + string(_msg));
                            
                            var _content_to_show = string(_msg);
                            
                            _content_npc = _content_npc + _content_to_show;
                        }
                    
                        // Mod端的数据更改日志显示
                        if (ds_map_exists(_data, "mod_action_msg")) {
                            var _mod_action_msg = ds_map_find_value(_data, "mod_action_msg");
                            scr_actionsLogUpdate(string(_mod_action_msg));

                            _content_npc = _content_npc +"\n"+ "*" +"\n" + string(_mod_action_msg);
                        }

                        _content_npc = _content_npc + "*";

                        // 将文本显示到对话框
                        var _obj_ind = asset_get_index("o_dialogue");
                        var _dialogue_inst = instance_find(_obj_ind, 0);
                        // 更换对话框中的npc消息
                        if(instance_exists(_dialogue_inst)) {
                            with(_dialogue_inst) {
                                // 如果传入的字符串不是 dialog key，scr_dialogue_set_text 会将其作为原始内容显示
                                scr_dialogue_set_text(_content_npc);
                                
                                // 强制刷新渲染器 (o_dialogRender)
                                var _render_ind = asset_get_index("o_dialogRender");
                                if (instance_exists(_render_ind)) {
                                    with(instance_find(_render_ind, 0)) {
                                        // 确保渲染状态同步
                                        if (variable_instance_exists(other, "is_activate")) {
                                            surfaceDraw = other.is_activate;
                                        }
                                        event_user(0); 
                                    }
                                }
                            }
                        }


                    } else {
                        scr_actionsLogUpdate("not_stone: " + string(_result));
                    }

                ds_map_destroy(_response_map);

                } else {
                    scr_actionsLogUpdate("not_stone: " + string(_result));
                }
            }
            else {
                scr_actionsLogUpdate("API错误: HTTP " + string(_http_status));
            }
        }
        else if (_status < 0)
        {
            scr_actionsLogUpdate("API错误: 网络请求失败");
        }
    }
    // } catch (_exception) {
    //    scr_actionsLogUpdate("Error in asyncHttp: " + string(_exception.message));
    // }
}

