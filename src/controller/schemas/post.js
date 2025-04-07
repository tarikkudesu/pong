export default {
    body : {
        type : 'object',
        properties : {
            id: {type : 'number'},
            name: {type : 'string'},
            bio: {type : 'string'},
        },
        required : ['id', 'name', 'bio']
    }
}