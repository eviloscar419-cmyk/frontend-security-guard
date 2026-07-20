async function handleRegister(email, password) {
    const result = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    return result;
}

