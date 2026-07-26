export default {
  routes: [
    {
      method: 'POST',
      path: '/app-users/upsert',
      handler: 'app-user.upsert',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
