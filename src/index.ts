// getInput - https://wellingguzman.com/notes/node-pipe-input
const getInput = () => (
	new Promise((resolve, reject) => {
    process.stdin.setEncoding('utf8');

    let data = '';
    process.stdin.on('data', chunk => data+=chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  })
);

module.exports = {
  name: `plugin-yarn-affected`,
  factory: require => {
    const { Command } = require(`clipanion`);
		const { Configuration, LocatorHash, Project, Workspace } = require('@yarnpkg/core');

    class YarnAffectedCommand extends Command {
      static paths = [[`affected`]];

      async execute() {
				const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
				const {project, workspace: cwdWorkspace} = await Project.find(configuration, this.context.cwd);

				if (!this.all && !cwdWorkspace)
					throw new WorkspaceRequiredError(project.cwd, this.context.cwd);

				const rootWorkspace = this.all
					? project.topLevelWorkspace
					: cwdWorkspace;
				console.log('root workspace:', rootWorkspace.manifest.name.name, rootWorkspace.relativeCwd);

				// Files piped into the command. ex. `git diff head --name-only|yarn affected`
				const input = (await getInput()).split("\n").filter(itm=>itm);

				// Map files to workspaces
				const fileMap = input.map(file => {
					for(const workspace of project.workspaces) {
						if(file.startsWith(workspace.relativeCwd)) {
							return { file, workspace };
						}
					}
					return { file, workspace: rootWorkspace };
				});

				// Group workspaces
				const affectedWorkspaces = fileMap.reduce((prevValue, currentValue) => {
					const key = currentValue.workspace.relativeCwd;
					const workspace = currentValue.workspace;
					const files = prevValue[key]?.files || [];
					files.push(currentValue.file);

					const value = { workspace, files };
					return { [ key ]: value, ...prevValue };
				}, {});

				console.log(affectedWorkspaces);
			}
    }

    return {
      commands: [
        YarnAffectedCommand,
      ],
    };
  }
};
