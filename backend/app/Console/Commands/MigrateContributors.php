<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class MigrateContributors extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:legacy-contributors';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import contributors from legacy JSON file';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $jsonPath = base_path('../syrian-contributors/public/contributors.json');

        if (!file_exists($jsonPath)) {
            $this->error("File not found: $jsonPath");
            return;
        }

        $json = file_get_contents($jsonPath);
        $data = json_decode($json, true);

        if (!$data) {
            $this->error("Failed to decode JSON");
            return;
        }

        $this->info("Found " . count($data) . " contributors. Importing...");

        $bar = $this->output->createProgressBar(count($data));
        $bar->start();

        foreach ($data as $item) {
            \App\Models\Contributor::updateOrCreate(
                ['name' => $item['username']], // Assuming username is unique identifier
                [
                    'total_contributions' => $item['total_contributions'] ?? 0,
                    'avatar_url' => $item['avatar_url'] ?? null,
                    // 'profile_url' => ... (JSON doesn't seem to have direct profile URL, can derive from github)
                ]
            );
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Import completed successfully.");
    }
}
