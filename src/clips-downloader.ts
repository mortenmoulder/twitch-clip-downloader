import ora                  from "ora";
import {fetchClips}         from "./clip-fetcher";
import {writeMetaFile}      from "./meta";
import prompts              from "prompts";
import {startClipsDownload} from "./media-downloader";
import cliProgress          from "cli-progress";

let apiSpinner: ora.Ora | null;
const downloadBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

export async function clips(channel: string, userId: string) {
    /**
     * API fetching phase
     */

    let totalBatches = 0;
    let finishedBatches = 0;
    if (!apiSpinner) {
        apiSpinner = ora('Paginating API, please wait...').start();
    }

    function onBatchGenerated(count: number) {
        totalBatches = count;
    }

    function onBatchFinished() {
        finishedBatches++;
    }

    function onCountUpdate(total: number) {
        if (apiSpinner) {
            apiSpinner.text = `Paginating API, found ${total} clips, ${finishedBatches}/${totalBatches} please wait...`;
        }
    }

    const clips = await fetchClips(userId, onBatchGenerated, onBatchFinished, onCountUpdate);
    const clipCount = Object.values(clips).length;

    apiSpinner.succeed('Finished API pagination.');
    apiSpinner = null;

    /**
     * Metadata phase
     */
    writeMetaFile(channel, Object.values(clips));

    /**
     * Confirmation phase
     */

    const confirmation = await prompts({
        type: 'confirm',
        name: 'value',
        message: `Found ${clipCount} clips to download, download now?`,
        initial: true
    });

    if (!confirmation.value) {
        console.log('Bye!');
        process.exit(0);
    }

    /**
     * Download phase
     */

    downloadBar.start(clipCount, 0);

    const finished = await startClipsDownload(Object.values(clips), count => downloadBar.update(count));

    downloadBar.stop();

    console.log(`Finished download of ${finished} out of ${clipCount}!`);
}
