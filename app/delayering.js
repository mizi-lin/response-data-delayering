import mu from "mzmu";

((mu) => {

    /**
     * 分析字段属性, 找出ID字段
     * @param key 属性字段名
     *
     * axxBxxId, axxBxxIds
     *
     * @return object: {
     *      name: string // model name
     *      isIds: boolean // 是否为ids的数组
     *      models: array // 各个model
     *      modelGroup: array // 按照权重不同, 从大到小, 组成不同的对象
     * }
     *
     * chinaProvinceUserId
     * models = [ china, province, user ]
     * modelGroup = [ chinaProvinceUser, provinceUser, user ]
     */
    let modelAnalysis = function(key) {

        let src = /(.*?)Id(|s)$/.exec(key),
            rst = {};

        if(!src) {
            return false;
        }

        rst.name = src[1] || '';
        rst.isIds = 's' === src[2];

        // 获得最小model
        // rst.model =  /((|[A-Z])[^A-Z]*)$/.exec(flat.name)[0].toLowerCase();

        // 将main model 化为 base model
        var name = rst.name.replace(/^([A-Z])/, function(m, i) {
            return m.toLowerCase() || i;
        });

        let models = name.match(/((^|([A-Z]))[^A-Z]*)/g),
            modelsGroup = [];

        rst.models = mu.map(mu.copy(models), function(v) {
            return v.toLowerCase();
        });

        // 以左到右的顺序, 从大到小依次组合成不同的model组合
        mu.each(rst.models, function() {
            modelsGroup.push(models.join(''));
            models.shift();
        });

        // 首字符小写
        rst.modelsGroup = mu.map(modelsGroup, (v) => {
            return v.replace(/^([A-Z])/, function(m, i) {
                return m.toLowerCase() || i;
            })
        });

        return rst;

    };

    /**
     * 数据匹配
     * @param response {Object}
     * @param modelGroup {Object}
     */
    let dataMatching = function(response, modelGroup) {

        if(!modelGroup) {
            return null;
        }

        let rst;

        for(let model of modelGroup) {
            if(rst = response[model]) {
                rst['__model__'] = model;
                return rst;
            }
        }

        return null;
    };

    /**
     * 数据映射
     * @param response
     * @param obj
     * @returns {*}
     */
    let dataMapping = function(response, obj) {

        mu.map(obj, function(v, key) {

            let analysis = modelAnalysis(key);

            if(analysis) {

                let mapping = dataMatching(response, modelGroup);

                if(analysis.isIds) {

                    obj[analysis.name] = [];

                    for(let id of v) {

                        obj[analysis.name].push(mapping[v] || v);

                    }

                } else {

                    obj[analysis.name] = mapping[v];

                }

            }
        });

        return obj;
    };

    /**
     * 结构化数据
     * @param response
     */

    window.delayering = function(response) {
        let data;

        if(mu.isObject(response)
            && (data = response.data)) {

            if(mu.isObject(data)){
                response = dataMapping(response, data);
            }

            if(mu.isArray(data)){

                data = mu.map(data, function(obj){
                    return dataMapping(response, data);
                });

                response.data = data;

            }

        }

        return response;
    }


})(mu);







