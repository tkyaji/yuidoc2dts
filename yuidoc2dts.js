
exports.todts = function(json) {

    normarizeJson(json);

    var text = '';
    for (var className in json.classes) {
        var content = json.classes[className];
        text += moduleText(content, 0) + line();
    }

    return text;
}

function normarizeJson(json) {
    for (idx in json.classes) {
        var cls1 = json.classes[idx];
        for (idx2 in json.classes) {
            var cls2 = json.classes[idx2];
            if (cls1.name == cls2.namespace) {
                delete json.classes[idx];
                break;
            }
        }
    }

    for (idx in json.classitems) {
        var item = json.classitems[idx];
        if (item.class in json.classes) {
            json.classes[item.class].classitems.push(item);
        }
    }
}

function moduleText(json, i) {
    var text = '';

    var moduleArr = json.namespace.split('.');

    text += line('/**', i);
    if (moduleArr.length > 0) {
        if (moduleArr.length > 1) {
            text += line('*', '@module', moduleArr[moduleArr.length - 2], i);
            text += line('*', '@submodule', moduleArr[moduleArr.length - 1], i);
        } else {
            text += line('*', '@module', moduleArr[moduleArr.length - 1], i);
        }
    }
    text += line('*/', i);

    text += line('declare module', json.namespace, '{', i);

    i++;
    text += classText(json, i);
    i--;

    text += line('}', i);

    return text;
}

function classText(json, i) {
    var text = '';

    var className = json.name.replace(json.namespace + '.', '');

    text += line('/**', i);
    var descriptions = json.description.split('\n');
    for (var idx in descriptions) {
        text += line('*', descriptions[idx], i);
    }
    text += line('*', i);
    text += line('*', '@class', className, i);
    if (json.extends) {
        var extendsText = json.extends.replace(json.namespace + '.', '');
        text += line('*', '@extends', extendsText, i);
    }
    text += line('*', '@namespace', json.namespace, i);
    if (json.is_constructor) {
        text += line('*', '@constructor', i);
        for (var idx in json.params) {
            var param = json.params[idx];
            text += paramLine(param, i, '*');
            if (param.type.toLowerCase() == 'object' && param.props) {
                for (var idx2 in param.props) {
                    var prop = param.props[idx2];
                    text += paramLine(prop, i, '*  ');
                }
            }
        }
    }
    text += line('*/', i);

    var extendsClass = null;
    if (json.extends) {
        extendsClass = 'extends ' + json.extends;
    }
    text += line('class', className, extendsClass, '{', i);
    if (json.is_constructor) {
        i++;
        text += line('constructor(' + paramArgs(json.params) + ');', i) + line();
        for (var idx in json.classitems) {
            var item = json.classitems[idx];
            if (item.itemtype == 'method') {
                text += classMethodText(item, i);
            } else if (item.itemtype == 'property') {
                text += classPropertyText(item, i);
            }
        }
        i--;
    }
    text += line('}', i);

    return text;
}

function classPropertyText(classItem, i) {
    var text = '';

    text += line('/**', i);
    var descriptions = classItem.description.split('\n');
    for (idx in descriptions) {
        text += line('*', descriptions[idx], i);
    }
    text += line('*', '@property', classItem.name, i);
    text += line('*', '@type', classItem.type, i);
    text += line('*', '@' + classItem.access, i);
    text += line('*/', i);

    text += line(classItem.access, classItem.name + ':', normalizeType(classItem.type) + ';', i) + line();

    return text;
}

function classMethodText(classItem, i) {
    var text = '';

    text += line('/**', i);
    var descriptions = classItem.description.split('\n');
    for (idx in descriptions) {
        text += line('*', descriptions[idx], i);
    }
    text += line('*', '@method', classItem.name, i);
    for (var idx in classItem.params) {
        var param = classItem.params[idx];
        text += paramLine(param, i, '*');
        if (param.type.toLowerCase() == 'object' && param.props) {
            for (var idx2 in param.props) {
                var prop = param.props[idx2];
                text += paramLine(prop, i, '*  ');
            }
        }
    }
    if (classItem.return) {
        text += returnLine(classItem.return, i, '*');
    }
    text += line('*', '@' + classItem.access, i);
    text += line('*/', i);

    var retType = 'void';
    if (classItem.return) {
        retType = normalizeType(classItem.return.type);
    }
    text += line(classItem.access, classItem.name + '(' + paramArgs(classItem.params) + '):', retType + ';', i) + line();

    return text;
}

function paramArgs(params) {
    var textArr = [];
    for (var idx in params) {
        var param = params[idx];
        var paramName = param.name;
        if (param.optional) {
            paramName += '?';
        }
        var text = paramName + ': ' + normalizeType(param.type);
        textArr.push(text);
    }
    return textArr.join(', ');
}

function normalizeType(paramType) {
    if (!paramType) {
        return 'any';
    }
    paramType = paramType.replace('{', '').replace('}', '');
    ptype = paramType.toLowerCase();
    switch (ptype) {
        case 'number':
        case 'boolean':
        case 'string':
        case 'void':
            return ptype;
        case 'bool':
            return 'boolean';
        case 'array':
            return 'Object';
        default:
            return paramType;
    }
}

function paramLine(param, i, prefix) {
    var textArr = [];
    textArr.push('@param');
    var paramName = param.name;
    if (param.optional) {
        paramName = '[' + paramName;
    }
    if (param.optdefault) {
        paramName += '=' + param.optdefault;
    }
    if (param.optional) {
        paramName += ']';
    }
    var descriptions = param.description.split('\n');
    textArr.push(paramName);
    if (param.type) {
        textArr.push('{' + param.type + '}');
    }
    textArr.push(descriptions[0]);

    var text = line(prefix, textArr.join(' '), i);
    for (var idx = 1; idx < descriptions.length; idx++) {
        text += line(prefix, descriptions[idx], i);
    }
    return text;
}

function returnLine(ret, i, prefix) {
    var textArr = [];
    textArr.push('@return');
    var descriptions = ret.description.split('\n');
    if (ret.type) {
        textArr.push('{' + ret.type + '}');
    }
    textArr.push(descriptions[0]);

    var text = line(prefix, textArr.join(' '), i);
    for (var idx = 1; idx < descriptions.length; idx++) {
        text += line(prefix, descriptions[idx], i);
    }
    return text;
}

function line(text, i) {
    var textArr = [];
    for (var idx = 0; idx < arguments.length - 1; idx++) {
        if (arguments[idx]) {
            textArr.push(arguments[idx]);
        }
    }
    return indent(arguments[arguments.length - 1]) + textArr.join(' ') + '\n';
}

function indent(count) {
    var text = '\t';
    var tmp = '';
    for (var i = 0; i < count; i++) {
        tmp += text;
    }
    return tmp;
}




function createText(classDef) {

    var defStr = "";

    /*
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        var classStrs = [];
        if (i == tokens.length - 1) {
            classStrs.push("export class");
        } else {
            classStrs.push("module");
        }

        classStrs.push(token);

        if (i == tokens.length - 1 && classDef.class.extends) {
            classStrs.push("extends");
            classStrs.push(classDef.class.extends);
        }

        classStrs.push("{");

        defStr += getLineStr(classStrs, i);
    }
    */

    defStr += getLineStr(["declare", "module", classDef.class.namespace, "{"]);

    var tokens = classDef.class.name.split(".");

    var classStrs = ["class", tokens[tokens.length - 1]];
    if (classDef.class.extends) {
        classStrs.push("extends");
        classStrs.push(classDef.class.extends);
    }
    classStrs.push("{");
    defStr += getLineStr(classStrs, 1);


    for (var i = 0; i < classDef.properties.length; i++) {
        var prop = classDef.properties[i];
//        var defaultStr = (prop.default ? "= " + prop.default : null);
        defStr += getLineStr([prop.name, ":", normarizeType(prop.type)], 2, true);
    }

    for (var i = 0; i < classDef.methods.length; i++) {
        var method = classDef.methods[i];

        var paramsStrs = [];
        if (method.params) {
            for (var j = 0; j < method.params.length; j++) {
                var param = method.params[j];
                var pname = (param.optional ? param.name + "?" : param.name);
                paramsStrs.push(getLineStr([pname, ":", normarizeType(param.type)], 0, false, true));
            }
        }
        var paramStr = "(" + paramsStrs.join(", ") + ")";

        if (method.name == "constructor") {
            defStr += getLineStr([method.name, paramStr], 2, true);
        } else {
            var retStr = method.return ? normarizeType(method.return.type || method.return.description) : "void";
            defStr += getLineStr([method.name, paramStr, ":", retStr], 2, true);
        }
    }


    defStr += getLineStr(["}"], 1);
    defStr += getLineStr(["}"]);

    /*
    for (var i = tokens.length - 1; i >= 0 ; i--) {
        defStr += getIndentStr(i);
        defStr += "}\n";
    }
    */

    return defStr;
}

function normarizeType(typeStr) {
    var typeList = {
        "number": "number",
        "boolean": "boolean",
        "string": "string",
    };
    typeStr = typeStr ? typeStr : "";
    typeStr = typeStr.replace("{", "").replace("}", "").toLowerCase();

    return (typeList[typeStr] || "any");
}

function getLineStr(tokens, indent, semicolon, noret) {
    var line = "";
    if (indent) {
        line += getIndentStr(indent);
    }

    for (var i = tokens.length - 1; i >= 0; i--) {
        if (!tokens[i]) {
            tokens.splice(i, 1);
        }
    }
    line += tokens.join(" ");

    if (semicolon) {
        line += ";";
    }
    if (!noret) {
        line += "\n";
    }
    return line;
}

function getIndentStr(num) {
    var indent = "    ";
    var indentStr = "";
    for (j = 0; j < num; j++) {
        indentStr += indent;
    }
    return indentStr;
}

function getRetText(retStr) {
    switch (retStr) {
        case "void":
            return "";
            break;
        case "boolean":
            return "return true;";
            break;
        case "number":
            return "return 0;";
            break;
        case "string":
            return "return \"\";";
            break;
        default:
            return "return null;";
            break;
    }
}
