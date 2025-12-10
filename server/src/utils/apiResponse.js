class apiResponse {
    constructor(statuscode, message = "Success", data = null) {
        this.statuscode = statuscode;
        this.message = message;
        this.data = data;
        this.success = statuscode < 400;
    }   
}


export { apiResponse };