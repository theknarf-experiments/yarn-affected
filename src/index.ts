module.exports = {
  name: `plugin-hello-world`,
  factory: require => {
    const {Command} = require(`clipanion`);

    class HelloWorldCommand extends Command {
      static paths = [[`hello`]];

      async execute() {
        this.context.stdout.write(`This is my very own plugin 😎\n`);
      }
    }

    return {
      commands: [
        HelloWorldCommand,
      ],
    };
  }
};
