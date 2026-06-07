import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from services.content import ContentService


class ContentServiceTests(unittest.TestCase):
    def test_lists_skills_and_rejects_path_traversal(self) -> None:
        with TemporaryDirectory() as temporary_directory:
            content_dir = Path(temporary_directory)
            (content_dir / "posts").mkdir()
            (content_dir / "skills").mkdir()
            (content_dir / "skills" / "projects.md").write_text("One two three.")
            service = ContentService(str(content_dir))

            self.assertEqual(
                service.list_skills(),
                [
                    {
                        "slug": "projects",
                        "title": "projects",
                        "preview": "One two three.",
                    }
                ],
            )
            self.assertIsNone(service.get_skill("../projects"))
            self.assertIsNone(service.get_post("../../secret"))


if __name__ == "__main__":
    unittest.main()
