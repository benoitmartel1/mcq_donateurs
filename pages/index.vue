<template>
  <div class="dashboard">
    <el-row>
      <div style="display:none">
        <div v-for="i in 6" :key="i">
          <nuxt-link class="container" :to="'/display/' + i"></nuxt-link>
        </div>
      </div>
      <ul>
        <li class="container">
          <span class="display">Écran</span><span class="status">Status</span>
          <div class="updated_at">Dernière connexion</div>
        </li>

        <li v-for="t in timeStamps" :key="t.id">
          <nuxt-link
            target="_blank"
            class="container"
            :to="'/display/' + t.display"
          >
            <span class="no display">{{ t.display }}</span>
            <i v-if="t.status" class="status el-icon-success"></i>
            <i v-else class="status el-icon-error"></i>
            <div class="updated_at">
              {{
                new Date(t.updated_at).toLocaleDateString("fr-CA") +
                  "  |  " +
                  new Date(t.updated_at).toLocaleTimeString("fr-CA")
              }}
            </div>
          </nuxt-link>
        </li>
      </ul>
    </el-row>
    <el-row>
      <span>Activer la grille</span>
      <el-switch @change="toggleGrid()" v-model="showGrid"> </el-switch>
    </el-row>
  </div>
</template>

<script>
let lastTimestamps = [];
export default {
  data() {
    return { timeStamps: [], showGrid: false };
  },
  async fetch() {
    this.showGrid = await this.$db
      .from("mcq_status")
      .select("showGrid")
      .eq("id", 1)
      .then(res => {
        return res.data[0].showGrid;
      });
  },
  mounted() {
    this.checkStatus();
    setInterval(() => {
      this.checkStatus();
    }, 10000);
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
    async toggleGrid() {
      const { data, error } = await this.$db
        .from("mcq_status")
        .update({ showGrid: this.showGrid })
        .eq("id", 1);
      if (error) {
        console.log(error);
      }
      if (data) {
        console.log(data);
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

        displays.map((d, index) => {
          d.status = new Date() - new Date(d.updated_at);
          d.status = Boolean(d.status / (1000 * 60 * 60 * 24) < 1);
          return d;
        });

        this.timeStamps = displays;
      });
    }
  }
};
</script>
<style>
@import url("https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;800&display=swap");
body,
html {
  font-family: "Open Sans", sans-serif;
}
ul {
  list-style-type: none;
  padding: 0;
  margin: auto;
}
* {
  box-sizing: border-box;
}
a {
  text-decoration: none;
  color: #666;
}
.dashboard {
  width: 600px;
  margin: auto;
  /* text-align: center; */
}
.el-row {
  margin-top: 50px;
}
.el-switch {
  margin-left: 20px;
}
.dashboard .container {
  display: flex;
  border-bottom: 1px grey solid;
}
.dashboard li.container {
  border-top: 1px grey solid;
}
.no {
  font-size: 1.5em;
  font-weight: 800;
}
.dashboard .container > * {
  display: flex;
  align-items: center;
  justify-content: center;
  /* text-align: center; */
  padding: 15px;
  border-left: grey 1px solid;
  /* margin-right: 5px; */
}

.dashboard .container > *:last-child {
  border-right: grey 1px solid;
}
.dashboard .el-icon-success {
  color: rgb(0, 184, 0);
  font-size: 38px;
}
.dashboard .el-icon-error {
  color: #999;
  font-size: 38px;
}
.container .display {
  width: 100px;
}
.container .status {
  width: 100px;
}
.container .updated_at {
  width: 400px;
}
</style>
