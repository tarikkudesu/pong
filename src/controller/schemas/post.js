export default {
    body : {
        type : 'object',
        properties : {
            username: {type : 'string'},
            email: {type : 'String'},
            bio: {type : 'string'},
        },
        required : ['id', 'name', 'bio']
    }
}