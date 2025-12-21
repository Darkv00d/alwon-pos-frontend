// Simple token storage for Java backend JWT authentication
export const TokenStorage = {
    set: (token: string) =\u003e {
        localStorage.setItem('alwon_auth_token', token);
  },

get: (): string | null =\u003e {
    return localStorage.getItem('alwon_auth_token');
},

clear: () =\u003e {
    localStorage.removeItem('alwon_auth_token');
}
};
