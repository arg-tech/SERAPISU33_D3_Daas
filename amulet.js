

function parse_move(move_data) {
    
    locution = {}
    if ("message" in move_data) {
        locution = {
            'type': 'question',
            'speaker': 'user',
            'hearer': 'amulet',
            'content': move_data['message']
        };
    } else if ("answer" in move_data) {
       locution = {
            'type': 'answer',
            'speaker': 'amulet',
            'hearer': 'user',
            'content': move_data['answer']['headline']
        };
    }
    return locution;
}

module.exports.parse_move = parse_move;
