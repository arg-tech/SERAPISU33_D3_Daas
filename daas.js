
const agents = [
    "CBAgent",
    "QICAgent",
];

var fs = require('fs');
const request = require('request');
var FormData = require('form-data');

nodeID_cnt = 1;
edgeID_cnt = 1;

QICTurn_check = 0;
CBTurn_check = 0;
callAMF = false;
resultsCreated = false;
resultfname = "results.json";
var resultsdata;

amf_json = {
    'edges' : [],
    'locutions' : [],
    'nodes' : [],
};

available_responses = [];
message_history = [];
communicated_responses = [];

function clear_responses(){
  
    console.log("IN CLEAR RESPONSES");
    available_responses = [];
    message_history = [];
    communicated_responses = [];
    resultsCreated = false;
   
    try {
         if (fs.existsSync(resultfname)) {
             fs.unlinkSync(resultfname);
             console.log("File cleared");
        }
    }  catch(err) {
        console.error(err)
    }

    
}

function clear_history(){

    for(var n in amf_json['nodes']) delete amf_json['nodes'][n]
    
    for(var l in amf_json['locutions']) delete amf_json['locutions'][l]
    
    for(var e in amf_json['edges']) delete amf_json['edges'][e]
    
    amf_json = {
        'edges' : [],
        'locutions' : [],
        'nodes' : []
    };
    
    nodeID_cnt = 1;
    edgeID_cnt = 1;
    QICTurn_check = 1;
	CBTurn_check = 1;
    ready_to_callAMF = false;

}



function amf_request(filepath) {

    var form = new FormData();
    form.append('file', fs.createReadStream(filepath));

    form.submit('http://amf2.arg.tech/dam-03', function(err, res) {

        var body = "";
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            console.log('Results');
            console.log(body);
            resultsdata = JSON.stringify(body);
            fs.writeFileSync(resultfname, body);
            QICTurn_check = 0;
			CBTurn_check = 0;
            resultsCreated = true;
        });
    });
}

function get_response(locution) {
    response = { "locutions": [] }
    if(locution['speaker'] == 'amulet') {
        CBresp = get_CB_response(locution);
        if(CBresp != null)
        {
            response['locutions'].push(CBresp);
        }
        QICresp = get_QIC_response(locution);
        if(QICresp != null)
        {
            response['locutions'].push(QICresp);
        }
        
    } 
    return response;
}


function get_CB_response(locution) {
    var CB_resp;
    var prev_numobj;
    console.log(locution['content']);
	if (locution['content'] != ""){
		var numobj = RegExp(/[A-Z]{5}\d{1}/).exec(locution['content']);
        console.log(numobj);
        if(CBTurn_check == 1) {
			// This should return IDMOB3 after the first two turns
            prev_numobj = numobj;
            CB_resp = null;
            
        } else if (Array.isArray(numobj) && numobj.length !== 0 && numobj == prev_numobj) {
			
            resp = "You are very focused on " + numobj[0] + ". Are you sure that there are no reasons for considering an alternative?";
           
            move = {"speaker": "CBAgent", "content": resp};
            QIC_resp = move;
            
        } else {
            CB_resp = null;
        }
	}
	CBTurn_check++;
    return CB_resp;
}

function get_QIC_response(locution) {
    var QIC_resp;
    message_history.push(locution);

    console.log(locution);
    if(QICTurn_check == 3) {
       callAMF = true;
    }

    if(callAMF){

      //  addLocutionToAMFjson(locution);
        create_amf_data();
        amf_json_str = JSON.stringify(amf_json);

        var filepath = "test.json";

        fs.writeFileSync(filepath, amf_json_str);

        console.log("Calling AMF....");
        console.log(amf_json_str);
        amf_request(filepath);

        callAMF = false;

    } 

    if(resultsCreated && (QICTurn_check==0 || QICTurn_check ==2)) {
        let rawdata = fs.readFileSync(resultfname);
        let res_json = JSON.parse(rawdata);

        create_responses(res_json);
        var resp = select_response();
        if(resp != ""){
            move = {"speaker": "QICAgent", "content": resp};
            //response['locutions'].push(move);
            QIC_resp = move;
        } else {
          //  response = { "locutions": [] }
            QIC_resp = null;
        }
    } else {
     //   response = { "locutions": [] }
        QIC_resp = null;
    }

    QICTurn_check ++;

    return QIC_resp;
}

function select_response(){
    for(var i=0; i<available_responses.length; i++){
        var resp = available_responses[i]
        if(!communicated_responses.includes(resp)){
            communicated_responses.push(resp);
            return resp;
        }
    } 
    return "";
}

function find_premise(res_json, s_id) {
    for(var e in res_json['edges']){
        var e = res_json['edges'][e];
        if(e['toID'] == s_id) {
            fromID = e['fromID'];
            for(var v in res_json['nodes']){
                var n = res_json['nodes'][v];
                if(n['nodeID'] == fromID){
                    return n['text'];
                }
                
            }
        }
    }
}

function find_conclusion(res_json, s_id) {
    for(var e in res_json['edges']){
        var e = res_json['edges'][e];
        if(e['fromID'] == s_id) {
            toID = e['toID'];
            for(var v in res_json['nodes']){
                var n = res_json['nodes'][v];
                if(n['nodeID'] == toID){
                    return n['text'];
                }
            }
        }
    }
}

function create_responses(res_json){
    for(var v in res_json['nodes']){
        var node = res_json['nodes'][v];
        
        if(node['type'] == 'CA'){
            var caid = node['nodeID'];
            var premise = find_premise(res_json, caid);
            var conclusion = find_conclusion(res_json, caid);
            var response = "Is the information '" + premise + "' in conflict with the '" + conclusion + "'?"
            if(!available_responses.includes(response)){
                available_responses.push(response);
            }
            
        } if(node['type'] == 'RA') {
            var raid = node['nodeID'];
            var premise = find_premise(res_json, raid);
            var conclusion = find_conclusion(res_json, raid);
            var response = "Is the information that '" + premise + "' relevant to concluding that '" + conclusion + "'?"
            if(!available_responses.includes(response)){
                available_responses.push(response);
            }
        }
    }
}


function create_amf_data(){
    clear_history();
    if(message_history.length >= 3) {
        for(var i=message_history.length-3; i<message_history.length; i++){
            addLocutionToAMFjson(message_history[i]);
        }
    }
}

function addLocutionToAMFjson(locution){
    aif_loc_id = nodeID_cnt ++;
    aif_inode_id = nodeID_cnt ++;
    aif_ya_id = nodeID_cnt ++;
    
    aif_locution = {
            'nodeID' : aif_loc_id.toString(),
            'type': 'L',
            'text': locution['speaker'] + ": " + locution['content']
        };
    
    loc = {
        'nodeID' : aif_loc_id.toString(),
        'personID' : '1'
    }
    
    inode = {
        'nodeID' : aif_inode_id.toString(),
        'type' : 'I',
        'text' : locution['content']
    };
    
    ya_node = {
        'nodeID' : aif_ya_id.toString(),
        'type' : 'YA',
        'text' : 'Default Illocuting'
    }
    
    edge1 = {
        'edgeID' : edgeID_cnt.toString(),
        'fromID' : aif_loc_id.toString(),
        'toID' : aif_ya_id.toString()
    };
    
    edgeID_cnt++;
    
    edge2 = {
        'edgeID' : edgeID_cnt.toString(),
        'fromID' : aif_ya_id.toString(),
        'toID' : aif_inode_id.toString()
    };
    
    
    edgeID_cnt ++;
    
    amf_json['nodes'].push(aif_locution);
    amf_json['nodes'].push(inode);
    amf_json['nodes'].push(ya_node);
    
    amf_json['locutions'].push(loc);
    
    amf_json['edges'].push(edge1);
    amf_json['edges'].push(edge2);
    
    
}

module.exports.get_response = get_response;
module.exports.clear_history = clear_history;
module.exports.clear_responses = clear_responses;

