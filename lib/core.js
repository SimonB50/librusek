const apiUrl = "https://synergia.librus.pl/gateway/api/2.0";

const upperFirst = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export { apiUrl, upperFirst };