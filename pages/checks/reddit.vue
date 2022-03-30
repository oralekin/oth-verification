<template>
  <div class="start">
    <p class="right-align">
      Currently verifying {{ username || "" }} ({{ osuId || "" }})
    </p>
    <div>
      <h1>Connect your Reddit account</h1>
    </div>
    <div>
      <p>
        In this step, we will need some information about your
        Reddit account.
      </p>
      <p>This information will be used to:</p>
      <ul>
        <li>
          Make sure your Reddit account was made before this years event began.
        </li>
        <li>
          Change the nickname on the discord server to your Reddit username.
        </li>
      </ul>
      <p>
        <strong>Make sure you're on the correct Reddit account before
          accepting the prompt on their side.</strong>
      </p>
    </div>
    <a
      href="/auth/reddit"
      class="flex button reddit"
    >
      Log in with Reddit!
    </a>
  </div>
</template>
<script lang="ts">
import { Context } from "@nuxt/types";
import { IUser } from "~/server/auth/IUser";
import Vue from "vue";

export default Vue.extend({
  name: "VerifyStepTwo",
  async asyncData({ req }: Context) {
    let username = "???";
    let osuId = "???";
    if (process.server) {
      const r: any = req;
      if (r.session.passport !== null) {
        const user: IUser = r.session.passport.user;
        username = user.osu.displayName || "???";
        osuId = user.osu.id || "???";
        return { username, osuId };
      }
    }
    return { username, osuId };
  },
});
</script>
