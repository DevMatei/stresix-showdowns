'use strict';

const BODY = '<p>This is one of ten identical test posts. Every CMS in the showdown gets the same ten posts, so the only thing that changes between runs is the CMS itself.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>';

module.exports = {
  register() {},

  // adds the same 10 posts every other cms gets and lets the public role
  // read them. safe to run again.
  async bootstrap({ strapi }) {
    const posts = strapi.documents('api::post.post');
    const existing = await posts.count({ status: 'published' });
    for (let i = existing + 1; i <= 10; i++) {
      await posts.create({ data: { title: `Test post ${i}`, body: BODY }, status: 'published' });
    }

    const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
    for (const action of ['api::post.post.find', 'api::post.post.findOne']) {
      const found = await strapi.db.query('plugin::users-permissions.permission').findOne({ where: { action, role: role.id } });
      if (!found) await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: role.id } });
    }
  },
};
