<template>
  <div>
    <button v-for="i in 7" :key="i">
      <nuxt-link :to="'/display/' + (i - 1)">{{ i - 1 }}</nuxt-link>
    </button>
    <!-- <table>
      <tr v-for="t in timeStamps" :key="t.display">
        <td>{{ t.display }}</td>
        <td class="status">
          <div v-if="t.status" class="on"></div>
          <div v-else class="off"></div>
        </td>
      </tr>
    </table> -->

    <!-- <button @click="emit()">EMIT</button> -->
  </div>
</template>

<script>
let lastTimestamps = [];
export default {
  data() {
    return { timeStamps: [] };
  },
  mounted() {
    // const mcqStatus = this.$db
    //   .from("mcq_status")
    //   .on("UPDATE", payload => {
    //     this.checkStatus();
    //   })
    //   .subscribe();
    setInterval(() => {
      this.checkStatus();
    }, 4000);
  },
  methods: {
    async getNewStatus() {
      const { data, error } = await this.$db
        .from("mcq_displays")
        .select("updated_at, display")
        .lt("display", 7)
        .order("display");
      if (data) {
        return data;
      }
    },
    async start(nb) {
      const { data, error } = await this.$db
        .from("mcq_status")
        .update({ status: nb })
        .eq("id", 1);
      if (error) {
        console.log(error);
      }
      if (data) {
        console.log(data);
      }
    },
    checkStatus() {
      let ctx = this;
      new Promise((resolve, reject) => {
        resolve(this.getNewStatus());
      }).then(displays => {
        let total = 0;
        lastTimestamps = [...this.timeStamps];

        if (lastTimestamps.length > 0) {
          displays.map((d, index) => {
            d.status = Boolean(
              new Date(d.updated_at) -
                new Date(lastTimestamps[index].updated_at)
            );
            if (d.status) total++;
            return d;
          });
          if (total > 0) {
            console.log("start");
            this.start(total);
          }
        }
        this.timeStamps = displays;
      });
    }
  }
};
</script>
<style scoped>
.status div {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}
.on {
  background: rgb(0, 255, 0);
}
.off {
  background: red;
}
</style>
