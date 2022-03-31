<template>
  <div class="start">
    <div>
      <h1> Welcome to /r/osuplace verification</h1>
    </div>
    <div>
      <p>
        You will be asked to login with your osu! account first, and then with your Reddit account, and last
        with your Discord account.
      </p>
      <p>Your osu! account information will be used to: </p>
      <ul>
        <li>
          Verify that you are an osu! player.
        </li>
        <li>
          Verify that your osu! account was made before March 20 2022.
        </li>
        <li><s>
          Verify that your top play is not mapped by Sotarks.
        </s></li>
      </ul>
      <p>Your Reddit account information will be used to: </p>
      <ul>
        <li>
          Read your username to change your Discord nickname to.
        </li>
        <li>
          Verify that your Reddit account was made before March 20 2022.
        </li>
      </ul>
      <p>Your Discord account information will be used to: </p>
      <ul>
        <li>
          Join your account to the server, if you haven't yet.
          </li>
        <li>
          Change your nickname on the Discord server to your Reddit username.
        </li>
        <li>Add a role to your user on the server.</li>
      </ul>
    </div>
    <div>
      <p>
        This web site is not endorsed by, directly affiliated with,
        maintained, authorized, or sponsored by osu!, ppy, Discord or Reddit. All
        product and company names are the registered trademarks of their
        original owners.
      </p>
      <p>By proceeding you will agree to the <strong>functional</strong> use of cookies.</p>
    </div>
    <a
      href="/auth/osu"
      class="flex button osu"
    > Log in with osu! </a>
    <p v-if="error !== ''" style="color:#FF4C4C; font-weight:bold; font-size: 1.2rem">{{error}}</p>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data: () => ({}),
  async asyncData({ req, error, $axios }) {
    let body = {
      error: ''
};

    if (process.server) {
      const request = req as any;
      if (request.session.flash !== undefined) {
        console.log(request.session.flash);
        if (request.session.flash.error !== undefined) {
          body.error = request.session.flash.error[0];
          request.flash("error");
        }
      }
    }

    return body;
  },
});
</script>
