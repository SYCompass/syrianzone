<?php

namespace App\Console\Commands;

use App\Models\Ballot;
use App\Models\BallotItem;
use App\Models\Candidate;
use App\Models\DailyRank;
use App\Models\DailyScore;
use App\Models\Poll;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImportLegacyPollData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'poll:import-legacy {path : The base path to the CSV files}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import legacy poll data from CSV files';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $basePath = $this->argument('path');
        
        // Define Polls manually since we don't have polls.csv
        $polls = [
            '2500bb5f-bcd0-4c31-a594-4409867bb82e' => [
                'slug' => 'best-ministers',
                'title' => 'Best Ministers',
                'is_active' => true,
            ],
            'e9d5dd2e-3bf5-48fa-8b08-802bc481d143' => [
                'slug' => 'jolani',
                'title' => 'Jolani Scenarios',
                'is_active' => true,
            ],
        ];

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::beginTransaction();

        try {
            // Import Polls
            foreach ($polls as $id => $data) {
                Poll::updateOrCreate(['id' => $id], $data);
                $this->info("Upserted poll: {$data['title']}");
            }

            // Helper to get full path
            $getFiles = fn($name) => $basePath . '/' . $name;

            // Import Candidates
            $this->importCandidates($getFiles('candidates.csv'));

            // Import DailyScores
            $this->importDailyScores($getFiles('daily_scores.csv'));

            // Import DailyRanks
            $this->importDailyRanks($getFiles('daily_ranks.csv'));

            // Import Ballots
            $this->importBallots($getFiles('ballots.csv'));

             // Import BallotItems
            $this->importBallotItems($getFiles('ballot_items.csv'));

            DB::commit();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            $this->info('Import completed successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            $this->error('Import failed: ' . $e->getMessage());
            $this->error($e->getTraceAsString());
        }
    }

    private function importCandidates($file)
    {
        $this->info("Importing candidates from $file");
        if (!file_exists($file)) {
            $this->warn("File not found: $file");
            return;
        }

        $handle = fopen($file, 'r');
        // skip header: "id","poll_id","name","title","image_url","category","sort","created_at"
        // actually header might be different order, let's assume standard order or read header
        $header = fgetcsv($handle);
        // expected: id,poll_id,name,title,image_url,category,sort,created_at
        
        while (($row = fgetcsv($handle)) !== false) {
             // Correct mapping based on file inspection:
             // "id","poll_id","name","image_url","sort","created_at","title","category"
             // 0: id, 1: poll_id, 2: name, 3: image_url, 4: sort, 5: created_at, 6: title, 7: category

             Candidate::updateOrCreate(
                ['id' => $row[0]],
                [
                    'poll_id' => $row[1],
                    'name' => $row[2],
                    'image_url' => $row[3],
                    'sort' => $row[4] === '' ? 0 : (int)$row[4],
                    'created_at' => $row[5],
                    'updated_at' => $row[5],
                    'title' => $row[6],
                    'category' => $row[7],
                ]
             );
        }
        fclose($handle);
        $this->info('Candidates imported.');
    }

    private function importBallots($file)
    {
         $this->info("Importing ballots from $file");
        if (!file_exists($file)) return;
        $handle = fopen($file, 'r');
        $header = fgetcsv($handle);
        // id,poll_id,vote_day,voter_key,ip_hash,user_agent,created_at

        $bar = $this->output->createProgressBar();
        
        while (($row = fgetcsv($handle)) !== false) {
            Ballot::updateOrCreate(
                ['id' => $row[0]],
                [
                    'poll_id' => $row[1],
                    'vote_day' => $row[2],
                    'voter_key' => $row[3],
                    'ip_hash' => $row[4],
                    'user_agent' => $row[5],
                    'created_at' => $row[6],
                    'updated_at' => $row[6], 
                ]
            );
            $bar->advance();
        }
        $bar->finish();
        fclose($handle);
        $this->newLine();
    }

    private function importBallotItems($file)
    {
        $this->info("Importing ballot items from $file");
        if (!file_exists($file)) return;
        $handle = fopen($file, 'r');
        $header = fgetcsv($handle);
        // id,ballot_id,candidate_id,tier,position

        $bar = $this->output->createProgressBar();

        while (($row = fgetcsv($handle)) !== false) {
            BallotItem::updateOrCreate(
                ['id' => $row[0]],
                [
                    'ballot_id' => $row[1],
                    'candidate_id' => $row[2],
                    'tier' => $row[3],
                    'position' => $row[4],
                ]
            );
            $bar->advance();
        }
        $bar->finish();
        fclose($handle);
        $this->newLine();
    }

    private function importDailyScores($file)
    {
        $this->info("Importing daily scores from $file");
        if (!file_exists($file)) return;
        $handle = fopen($file, 'r');
        $header = fgetcsv($handle);
        // poll_id,candidate_id,day,votes,score,updated_at

        while (($row = fgetcsv($handle)) !== false) {
            DailyScore::updateOrCreate(
                [
                    'poll_id' => $row[0],
                    'candidate_id' => $row[1],
                    'day' => $row[2],
                ],
                [
                    'votes' => $row[3],
                    'score' => $row[4],
                    'updated_at' => $row[5],
                ]
            );
        }
        fclose($handle);
        $this->info('Daily scores imported.');
    }

    private function importDailyRanks($file)
    {
        $this->info("Importing daily ranks from $file");
        if (!file_exists($file)) return;
        $handle = fopen($file, 'r');
        $header = fgetcsv($handle);
        // poll_id,candidate_id,day,rank,votes,score,created_at

        while (($row = fgetcsv($handle)) !== false) {
             DailyRank::updateOrCreate(
                [
                    'poll_id' => $row[0],
                    'candidate_id' => $row[1],
                    'day' => $row[2],
                ],
                [
                    'rank' => $row[3],
                    'votes' => $row[4],
                    'score' => $row[5],
                    'created_at' => $row[6],
                ]
            );
        }
        fclose($handle);
        $this->info('Daily ranks imported.');
    }
}
