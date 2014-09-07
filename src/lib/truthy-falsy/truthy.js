define(function () {
    return truthy;

    function truthy(value) {
        return typeof value !== 'undefined' && value;
    }
})
