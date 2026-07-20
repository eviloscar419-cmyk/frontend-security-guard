async function handleLogin(email, password) {
    const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    return result;
}

