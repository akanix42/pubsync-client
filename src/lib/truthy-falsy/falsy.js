define(function () {
    return falsy;

    function falsy(value) {
        return typeof value === 'undefined' || !value;
    }
})
